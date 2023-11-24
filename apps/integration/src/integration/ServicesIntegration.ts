import { LeaveRequest } from 'src/sage/SageServiceInterfaces';
import { EventUpsertData } from 'src/calendar/CalendarServiceInterfaces';
import {
  findLeaveRequestCalendarEventBySageId,
  insertLeaveRequestCalendarEvent,
  updateLeaveRequestCalendarEvent,
} from '../database/entities/LeaveRequestCalendarEventDataSource';
import { CalendarService } from '../calendar';
import { SageService } from '../sage';

const TEST_ACCOUNTS = ['darce@litebox.ai', 'fmenendez@litebox.ai'];

const sageService = new SageService({
  sageDomain: 'https://litebox.sage.hr',
  sageApiKey: process.env.SAGE_API_KEY,
});
const calendarId =
  'c_afbd821650afdc9c26bcf37531bc49e9da3c141b1c093d72ab10c558d77ff963@group.calendar.google.com';

// load the environment variable with keys
const keysEnvVar = process.env.GOOGLE_CALENDAR_CREDENTIALS;
if (!keysEnvVar) {
  throw new Error(
    'The $GOOGLE_CALENDAR_CREDENTIALS environment variable was not found!',
  );
}
const keys = JSON.parse(keysEnvVar);
const calendarService = new CalendarService({
  calendarId,
  accountPrivateKey: keys.private_key,
  clientEmail: keys.client_email,
  subjectEmail: 'darce@litebox.ai',
});

async function getApprovedLeaveRequests(fromDate, toDate) {
  const leaveRequests = await sageService.fetchLeaveRequests(fromDate, toDate);
  return leaveRequests.filter(
    (leaveRequest) =>
      leaveRequest.statusCode === 'approved' &&
      TEST_ACCOUNTS.includes(leaveRequest.employee.email),
  );
}

function createEventUpsertDataFromLeaveRequest(
  leaveRequest: LeaveRequest,
): EventUpsertData {
  let start;
  let end;

  if (leaveRequest.startTime && leaveRequest.endTime) {
    start = {
      dateTime: `${leaveRequest.startDate}T${leaveRequest.startTime}:00`,
    };
    end = { dateTime: `${leaveRequest.endDate}T${leaveRequest.endTime}:00` };
  } else {
    start = { date: leaveRequest.startDate };
    end = { date: leaveRequest.endDate };
  }

  const eventData: EventUpsertData = {
    visibility: 'public',
    transparency: 'opaque', // indicates that attendee will appear as busy
    summary: `${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}: ${leaveRequest.policy?.name}`,
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

async function createCalendarEvent(leaveRequest) {
  try {
    const leaveCalendarEventData =
      createEventUpsertDataFromLeaveRequest(leaveRequest);
    const calendarEvent = await calendarService.createEvent(
      leaveCalendarEventData,
    );

    await insertLeaveRequestCalendarEvent({
      sageLeaveRequestId: leaveRequest.id,
      calendarEventId: calendarEvent.id,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      startTime: leaveRequest.startTime,
      endTime: leaveRequest.endTime,
    });

    console.log(`📅 Calendar Event Created: ${calendarEvent.summary}`);
  } catch (error) {
    console.error('Error creating calendar event:', error);
  }
}

async function updateCalendarEvent(leaveRequest, leaveRequestCalendarEvent) {
  await calendarService.deleteEvent(leaveRequestCalendarEvent.calendarEventId);

  const leaveCalendarEventData =
    createEventUpsertDataFromLeaveRequest(leaveRequest);
  const calendarEvent = await calendarService.createEvent(
    leaveCalendarEventData,
  );

  updateLeaveRequestCalendarEvent(leaveRequestCalendarEvent.id, {
    sageLeaveRequestId: leaveRequest.id,
    calendarEventId: calendarEvent.id,
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    startTime: leaveRequest.startTime,
    endTime: leaveRequest.endTime,
  });
}

function shouldUpdateCalendarEvent(leaveRequest, leaveRequestCalendarEvent) {
  return (
    leaveRequestCalendarEvent.startDate !== leaveRequest.startDate ||
    leaveRequestCalendarEvent.endDate !== leaveRequest.endDate ||
    leaveRequestCalendarEvent.startTime !== leaveRequest.startTime ||
    leaveRequestCalendarEvent.endTime !== leaveRequest.endTime
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
          `✅ Event Calendar already exists for leave request: ${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}: ${leaveRequest.policy?.name}`,
        );
      }
    }),
  );
}

const syncSageWithCalendar = async () => {
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 60);

  const formattedFromDate = fromDate.toISOString().split('T')[0];
  const formattedToDate = toDate.toISOString().split('T')[0];

  const approvedLeaveRequests = await getApprovedLeaveRequests(
    formattedFromDate,
    formattedToDate,
  );
  await createOrUpdateCalendarEvents(approvedLeaveRequests);
};

export { syncSageWithCalendar };
