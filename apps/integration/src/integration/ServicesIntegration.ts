import { LeaveRequest } from 'src/sage/SageServiceInterfaces';
import { EventUpsertData } from 'src/calendar/CalendarServiceInterfaces';
import { CalendarService } from '../calendar';
import { SageService } from '../sage';

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

function createEventFromLeaveRequest(leave: LeaveRequest): EventUpsertData {
  // TODO: add logic check if is full date, or if is part of the date , or if is partial time
  const eventData: EventUpsertData = {
    summary: `${leave.employee.lastName} ${leave.employee.firstName}: ${leave.policy?.name}`,
    description: leave.details,
    attendees: [{ email: leave.employee.email, responseStatus: 'accepted' }],
    reminders: { useDefault: true },
    start: {
      dateTime: `${leave.startDate}T${leave.startTime || '00:00'}:00`,
      // TODO: need a way to find the timezone in IANA timezone format: https://developers.google.com/calendar/api/concepts/events-calendars#time_zones
      // timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: `${leave.endDate}T${leave.endTime || '00:00'}:00`,
      // timeZone: 'America/Los_Angeles',
    },
  };

  return eventData;
}

const syncSageWithCalendar = async () => {
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 60);

  const formattedFromDate = fromDate.toISOString().split('T')[0];
  const formattedToDate = toDate.toISOString().split('T')[0];

  const leaveRequests = await sageService.fetchLeaveRequests(
    formattedFromDate,
    formattedToDate,
  );

  const approvedLeaveRequests = leaveRequests.filter(
    (requestLeave) => requestLeave.statusCode === 'approved',
  );

  const eventsToCreate = approvedLeaveRequests.map((leaveRequest) =>
    createEventFromLeaveRequest(leaveRequest),
  );

  console.log('eventsToCreate', eventsToCreate);
};

export { syncSageWithCalendar };
