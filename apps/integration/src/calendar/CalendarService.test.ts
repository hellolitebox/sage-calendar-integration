import mockGoogleApis from './mock/mockGoogleApis';
import { google } from 'googleapis';
import { mockCalendarData } from './mock/mockCalendarData';
import { mockEvent, mockListEventsResponse } from './mock/mockEventData';
import CalendarService from './CalendarService';

jest.mock('googleapis', () => mockGoogleApis);

describe('CalendarService', () => {
  let calendarService;
  let mockCalendarInstance;

  beforeEach(() => {
    jest.resetModules();

    mockCalendarInstance = google.calendar({
      version: 'v3',
      auth: new google.auth.JWT(
        'test-clientEmail@domain.com',
        null,
        'test-accountPrivateKey',
        ['https://www.googleapis.com/auth/calendar'],
        'test-subjectEmail@domain.com'
      ),
    });

    calendarService = new CalendarService({
      calendarId: 'test-calendar-id',
      calendarInstance: mockCalendarInstance,
    });
  });

  test('getCalendarById returns calendar data', async () => {
    const calendarData = await calendarService.getCalendarById(
      'test-calendar-id'
    );

    expect(calendarData).toEqual(mockCalendarData);
    expect(mockCalendarInstance.calendars.get).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
    });
  });

  test('getEvents returns events data', async () => {
    const eventsData = await calendarService.getEvents(
      '2023-11-01',
      '2023-12-31'
    );

    expect(eventsData).toEqual([mockEvent]);
    expect(mockCalendarInstance.events.list).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date('2023-11-01').toISOString(),
      timeMax: new Date('2023-12-31').toISOString(),
    });
  });

  test('getEvent returns event data', async () => {
    const eventsData = await calendarService.getEvent('mockedEventId');

    expect(eventsData).toEqual(mockEvent);
    expect(mockCalendarInstance.events.get).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
      eventId: 'mockedEventId',
    });
  });

  test('createEvent returns created event data', async () => {
    const newEventData = {
      visibility: 'public',
      transparency: 'opaque',
      summary: `new test event data`,
      description: `new test event description`,
      attendees: [{ email: 'attendee@domain.com', responseStatus: 'accepted' }],
      reminders: { useDefault: true },
      start: {
        dateTime: new Date('2023-12-06').toISOString().slice(0, 10),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: new Date('2023-12-06').toISOString().slice(0, 10),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
    };
    const createdEvent = await calendarService.createEvent(newEventData);
    expect(createdEvent).toMatchObject({
      ...newEventData,
    });
    expect(mockCalendarInstance.events.insert).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
      requestBody: newEventData,
      sendUpdates: 'all',
    });
  });

  test('updateEvent returns updated event data', async () => {
    const updateEventData = {
      summary: `new test event data`,
      description: `new test event description`,
      attendees: [{ email: 'attendee@domain.com', responseStatus: 'accepted' }],
      start: {
        dateTime: new Date('2023-12-07').toISOString().slice(0, 10),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: new Date('2023-12-08').toISOString().slice(0, 10),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
    };
    const updatedEvent = await calendarService.updateEvent(
      'test-event-id',
      updateEventData
    );
    expect(updatedEvent).toMatchObject({
      ...updatedEvent,
    });
    expect(mockCalendarInstance.events.update).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
      requestBody: updateEventData,
      eventId: 'test-event-id',
    });
  });

  test('deleteEvent returns success', async () => {
    const updateEventData = {
      summary: `new test event data`,
      description: `new test event description`,
      attendees: [{ email: 'attendee@domain.com', responseStatus: 'accepted' }],
      start: {
        dateTime: new Date('2023-12-07').toISOString().slice(0, 10),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: new Date('2023-12-08').toISOString().slice(0, 10),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
    };
    const response = await calendarService.deleteEvent(
      'test-event-id',
      updateEventData
    );
    expect(response).toMatchObject({
      success: true,
    });
    expect(mockCalendarInstance.events.delete).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
      eventId: 'test-event-id',
    });
  });

  test('getCalendarById handles errors', async () => {
    mockCalendarInstance.calendars.get.mockRejectedValue(
      new Error('Test error')
    );
    const logSpy = jest.spyOn(console, 'log');

    const result = await calendarService.getCalendarById('test-calendar-id');

    expect(result).toBeNull();
    expect(logSpy).toHaveBeenCalledWith(
      'Error fetching calendar with ID test-calendar-id:',
      expect.any(Error)
    );
  });

  test('getEvents handles invalid dates', async () => {
    const result = await calendarService.getEvents(
      'invalid-date',
      'invalid-date'
    );

    expect(mockCalendarInstance.events.list).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('getEvents without dates', async () => {
    const eventsData = await calendarService.getEvents();

    expect(eventsData).toEqual([mockEvent]);
    expect(mockCalendarInstance.events.list).toHaveBeenCalledWith({
      calendarId: 'test-calendar-id',
      singleEvents: true,
      orderBy: 'startTime',
    });
  });
});
