export interface CalendarServiceConfig {
  calendarId: string;
  clientEmail: string;
  accountPrivateKey: string;
  subjectEmail: string;
}
interface EventDateTime {
  dateTime: string;
  timeZone?: string;
}

interface EventAttendee {
  email: string;
  responseStatus: string;
}

interface EventReminderOverride {
  method: string;
  minutes: number;
}

interface EventReminder {
  useDefault: boolean;
  overrides?: EventReminderOverride[];
}

interface OutOfOfficeProp {
  autoDeclineMode: string;
  declineMessage?: string;
}

export interface EventUpsertData {
  transparency?: string;
  visibility?: string;
  eventType?: string;
  outOfOfficeProperties?: OutOfOfficeProp;
  summary?: string;
  location?: string;
  description?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  attendees: EventAttendee[];
  reminders: EventReminder;
}

interface EventOrganizer {
  email: string;
  displayName: string;
  self: boolean;
}

export interface CalendarEventResponse {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string;
  location: string;
  creator: {
    email: string;
  };
  organizer: EventOrganizer;
  start: EventDateTime;
  end: EventDateTime;
  iCalUID: string;
  sequence: number;
  attendees: EventAttendee[];
  reminders: EventReminder;
  eventType: string;
}

export interface GetEventsParams {
  calendarId: string;
  singleEvents: boolean;
  orderBy: string;
  timeMin?: string;
  timeMax?: string;
}
