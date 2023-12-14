import type { CalendarEventResponse } from '../CalendarServiceInterfaces';

const mockCalendarEventResponse: CalendarEventResponse = {
  kind: 'calendar#event',
  etag: 'etagExample',
  id: 'eventIdExample',
  status: 'confirmed',
  htmlLink: 'https://www.example.com',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  summary: 'John Doe: Vacaciones',
  description: 'Taking leave for personal reasons',
  location: 'America/Argentina/Buenos_Aires',
  creator: {
    email: 'creator@example.com',
  },
  organizer: {
    displayName: 'test organizer',
    email: 'organizer@example.com',
    self: false,
  },
  start: {
    dateTime: '2023-01-10T09:00:00',
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  end: {
    dateTime: '2023-01-10T17:00:00',
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  iCalUID: 'iCalUIDExample',
  sequence: 0,
  attendees: [{ email: 'johndoe@domain.com', responseStatus: 'accepted' }],
  reminders: {
    useDefault: true,
  },
  eventType: 'default',
};

export { mockCalendarEventResponse };
