import type { LeaveRequest } from 'src/sage/SageServiceInterfaces';
import type { EventUpsertData } from 'src/calendar/CalendarServiceInterfaces';
import type { LeaveRequestCalendarEvent } from '../database/entities/LeaveRequestCalendarEventEntity';
import { findTimeZoneByCountryCode } from '../tz-locales';
import {
  deleteLeaveRequestCalendarEvent,
  findLeaveRequestCalendarEventBySageId,
  findLeaveRequestCalendarEventsBySageIds,
  insertLeaveRequestCalendarEvent,
  updateLeaveRequestCalendarEvent,
} from '../database/entities/LeaveRequestCalendarEventDataSource';
import { CalendarService } from '../calendar';
import { SageService } from '../sage';

const sageService = new SageService({
  sageDomain: process.env.SAGE_DOMAIN,
  sageApiKey: process.env.SAGE_API_KEY,
});

// load the environment variable with keys
const keysEnvVar = process.env.GOOGLE_CALENDAR_CREDENTIALS;
if (!keysEnvVar) {
  throw new Error(
    'The $GOOGLE_CALENDAR_CREDENTIALS environment variable was not found!'
  );
}

const keys = JSON.parse(keysEnvVar);
const calendarService = new CalendarService({
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  accountPrivateKey: keys.private_key,
  clientEmail: keys.client_email,
  subjectEmail: process.env.GOOGLE_CALENDAR_SUBJECT_EMAIL,
});

function getTestUsers(): number[] {
  return process.env.TEST_USERS
    ? process.env.TEST_USERS.split(',').map(Number)
    : [];
}

async function getFilteredLeaveRequests(
  leaveRequests: LeaveRequest[],
  statusCode: string,
  filterTestUsers = false
) {
  const testUsers = filterTestUsers ? getTestUsers() : null;

  return leaveRequests.filter((leaveRequest) => {
    const isStatusMatch = leaveRequest.statusCode === statusCode;
    const isTestUser = filterTestUsers
      ? testUsers.includes(leaveRequest.employee.id)
      : true;

    return isStatusMatch && isTestUser;
  });
}

async function getApprovedLeaveRequests(leaveRequests: LeaveRequest[]) {
  const filterTestUsers = process.env.ENABLE_TEST_USERS_ALL === 'true';
  return getFilteredLeaveRequests(leaveRequests, 'approved', filterTestUsers);
}

async function getCancelledLeaveRequests(leaveRequests: LeaveRequest[]) {
  const filterTestUsers = process.env.ENABLE_TEST_USERS_ALL === 'true';
  return getFilteredLeaveRequests(leaveRequests, 'canceled', filterTestUsers);
}

async function deleteObsoleteLeaveRequestCalendarEvent(
  obsoleteLeaveRequestCalendarEvent: LeaveRequestCalendarEvent[]
) {
  await Promise.all(
    obsoleteLeaveRequestCalendarEvent.map(
      async (event: LeaveRequestCalendarEvent) => {
        try {
          await calendarService.deleteEvent(event.calendarEventId);
          await deleteLeaveRequestCalendarEvent(event.id);
          console.log(
            `❌ Event Calendar removed for cancelled leave request id: ${event.sageLeaveRequestId}`
          );
        } catch (error) {
          console.error('Error deleting calendar event:', error);
        }
      }
    )
  );
}

function createEventUpsertDataFromLeaveRequest(
  leaveRequest: LeaveRequest
): EventUpsertData {
  const timeZone = findTimeZoneByCountryCode(leaveRequest.employee.country);

  let start;
  let end;

  if (leaveRequest.startTime && leaveRequest.endTime) {
    start = {
      dateTime: `${leaveRequest.startDate}T${leaveRequest.startTime}:00`,
      timeZone,
    };
    end = {
      dateTime: `${leaveRequest.endDate}T${leaveRequest.endTime}:00`,
      timeZone,
    };
  } else {
    start = { date: leaveRequest.startDate, timeZone };
    end = { date: leaveRequest.endDate, timeZone };
  }

  const eventData: EventUpsertData = {
    visibility: 'public',
    transparency: 'opaque', // indicates that attendee will appear as busy
    summary: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}: ${leaveRequest.policy?.name}`,
    description: leaveRequest.details,
    attendees: [
      { email: leaveRequest.employee.email, responseStatus: 'accepted' },
    ],
    reminders: { useDefault: true },
    start,
    end,
  };

  return eventData;
}

async function createCalendarEvent(leaveRequest: LeaveRequest) {
  try {
    const leaveCalendarEventData =
      createEventUpsertDataFromLeaveRequest(leaveRequest);
    const calendarEvent = await calendarService.createEvent(
      leaveCalendarEventData
    );

    const startDateTime = leaveRequest.startTime
      ? new Date(`${leaveRequest.startDate}T${leaveRequest.startTime}`)
      : new Date(leaveRequest.startDate);

    const endDateTime = leaveRequest.endTime
      ? new Date(`${leaveRequest.endDate}T${leaveRequest.endTime}`)
      : new Date(leaveRequest.endDate);

    await insertLeaveRequestCalendarEvent({
      sageLeaveRequestId: leaveRequest.id,
      calendarEventId: calendarEvent.id,
      startDateTime,
      endDateTime,
    });

    console.log(`✅ Calendar Event Created: ${calendarEvent.summary}`);
  } catch (error) {
    console.error('Error creating calendar event:', error);
  }
}

async function updateCalendarEvent(
  leaveRequest: LeaveRequest,
  leaveRequestCalendarEvent: LeaveRequestCalendarEvent
) {
  try {
    await calendarService.deleteEvent(
      leaveRequestCalendarEvent.calendarEventId
    );

    const leaveCalendarEventData =
      createEventUpsertDataFromLeaveRequest(leaveRequest);
    const calendarEvent = await calendarService.createEvent(
      leaveCalendarEventData
    );

    const startDateTime = leaveRequest.startTime
      ? new Date(`${leaveRequest.startDate}T${leaveRequest.startTime}`)
      : new Date(leaveRequest.startDate);

    const endDateTime = leaveRequest.endTime
      ? new Date(`${leaveRequest.endDate}T${leaveRequest.endTime}`)
      : new Date(leaveRequest.endDate);

    updateLeaveRequestCalendarEvent(leaveRequestCalendarEvent.id, {
      sageLeaveRequestId: leaveRequest.id,
      calendarEventId: calendarEvent.id,
      startDateTime,
      endDateTime,
    });
    console.log(`🔁 Calendar Event updated: ${calendarEvent.summary}`);
  } catch (error) {
    console.error('Error updating calendar event:', error);
  }
}

function areDateTimesEqual(dateTime1: Date, dateTimeAsString: string) {
  const dateTime2 = new Date(dateTimeAsString);

  return (
    dateTime1.getFullYear() === dateTime2.getFullYear() &&
    dateTime1.getMonth() === dateTime2.getMonth() &&
    dateTime1.getDate() === dateTime2.getDate() &&
    dateTime1.getHours() === dateTime2.getHours() &&
    dateTime1.getMinutes() === dateTime2.getMinutes()
  );
}

function shouldUpdateCalendarEvent(
  leaveRequest: LeaveRequest,
  leaveRequestCalendarEvent: LeaveRequestCalendarEvent
) {
  const startDateTimeStr = leaveRequest.startTime
    ? `${leaveRequest.startDate}T${leaveRequest.startTime}`
    : leaveRequest.startDate;

  const endDateTimeStr = leaveRequest.endTime
    ? `${leaveRequest.endDate}T${leaveRequest.endTime}`
    : leaveRequest.endDate;

  return (
    !areDateTimesEqual(
      leaveRequestCalendarEvent.startDateTime,
      startDateTimeStr
    ) ||
    !areDateTimesEqual(leaveRequestCalendarEvent.endDateTime, endDateTimeStr)
  );
}

async function createOrUpdateCalendarEvents(leaveRequests: LeaveRequest[]) {
  await Promise.all(
    leaveRequests.map(async (leaveRequest: LeaveRequest) => {
      const [leaveRequestCalendarEvent] =
        await findLeaveRequestCalendarEventBySageId(leaveRequest.id);
      const isNewRequest = !leaveRequestCalendarEvent;

      if (isNewRequest) {
        await createCalendarEvent(leaveRequest);
      } else if (
        shouldUpdateCalendarEvent(leaveRequest, leaveRequestCalendarEvent)
      ) {
        await updateCalendarEvent(leaveRequest, leaveRequestCalendarEvent);
      } else {
        console.log(
          `📅 Event Calendar already exists for leave request: ${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}: ${leaveRequest.policy?.name}`
        );
      }
    })
  );
}

const syncSageWithCalendar = async () => {
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 60);

  const formattedFromDate = fromDate.toISOString().split('T')[0];
  const formattedToDate = toDate.toISOString().split('T')[0];

  const allLeaveRequests = await sageService.fetchLeaveRequests(
    formattedFromDate,
    formattedToDate
  );
  const approvedLeaveRequests = await getApprovedLeaveRequests(
    allLeaveRequests
  );

  await createOrUpdateCalendarEvents(approvedLeaveRequests);

  const cancelledLeaveRequests = await getCancelledLeaveRequests(
    allLeaveRequests
  );

  const cancelledLeaveRequestIds = cancelledLeaveRequests.map(
    (cancelledLeaveRequest: LeaveRequest) => cancelledLeaveRequest.id
  );

  const obsoleteEvents = await findLeaveRequestCalendarEventsBySageIds(
    cancelledLeaveRequestIds
  );

  await deleteObsoleteLeaveRequestCalendarEvent(obsoleteEvents);
};

export { syncSageWithCalendar };
