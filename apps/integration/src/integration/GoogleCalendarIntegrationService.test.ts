import { CalendarService } from '../calendar';
import { mockCalendarData } from '../calendar/mock/mockCalendarData';
import { mockCalendarEventResponse } from '../calendar/mock/mockCalendarEventResponse';
import { GoogleCalendarIntegrationService } from './GoogleCalendarIntegrationService';
import { mockLeaveRequests } from '../sage/mock/mockLeaveRequest';

jest.mock('../sage/SageService');
jest.mock('../calendar');
jest.mock('../database/entities/LeaveRequestCalendarEventDataSource');

// Calendar Service Mocked functions
CalendarService.prototype.getCalendarById = jest
  .fn()
  .mockResolvedValue(mockCalendarData);

CalendarService.prototype.deleteEvent = jest
  .fn()
  .mockResolvedValue({ success: true });

CalendarService.prototype.createEvent = jest.fn((leaveCalendarEventData) =>
  Promise.resolve({
    ...mockCalendarEventResponse,
    summary: leaveCalendarEventData.summary,
    description: leaveCalendarEventData.description,
    attendees: leaveCalendarEventData.attendees,
    start: leaveCalendarEventData.start,
    end: leaveCalendarEventData.end,
  })
);

describe('GoogleCalendarIntegrationService', () => {
  const logSpy = jest.spyOn(console, 'log');
  let calendarServiceMock;
  let googleCalendarIntegrationService;

  beforeEach(() => {
    calendarServiceMock = new CalendarService({
      calendarId: 'test-calendar-id',
    });
    googleCalendarIntegrationService = new GoogleCalendarIntegrationService(
      calendarServiceMock
    );
  });

  it('Should Create a new Calendar Event', async () => {
    const integrationLeaveId =
      await googleCalendarIntegrationService.handleCreateLeaveRequest(
        mockLeaveRequests[0]
      );
    expect(calendarServiceMock.createEvent).toHaveBeenCalledWith({
      attendees: [
        {
          email: 'johndoe@domain.com',
          responseStatus: 'accepted',
        },
      ],
      description: 'Taking leave for personal reasons',
      end: {
        dateTime: '2023-01-10T17:00:00',
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      reminders: {
        useDefault: true,
      },
      start: {
        dateTime: '2023-01-10T09:00:00',
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      summary: 'John Doe: Vacaciones',
      transparency: 'opaque',
      visibility: 'public',
    });
    expect(integrationLeaveId).toBe('eventIdExample');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Calendar Event Created: John Doe: Vacaciones')
    );
  });

  it('should update calendar Event for leave request', async () => {
    const integrationLeaveId =
      await googleCalendarIntegrationService.handleUpdateLeaveRequest(
        {
          ...mockLeaveRequests[0],
          startDate: '2023-01-10',
          endDate: '2023-01-11',
          startTime: null,
          endTime: null,
        },
        'oldCalendarEventIdMock'
      );
    expect(calendarServiceMock.deleteEvent).toHaveBeenCalledWith(
      'oldCalendarEventIdMock'
    );
    expect(calendarServiceMock.createEvent).toHaveBeenCalledWith({
      attendees: [
        {
          email: 'johndoe@domain.com',
          responseStatus: 'accepted',
        },
      ],
      description: 'Taking leave for personal reasons',
      end: {
        date: '2023-01-11',
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      reminders: {
        useDefault: true,
      },
      start: {
        date: '2023-01-10',
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      summary: 'John Doe: Vacaciones',
      transparency: 'opaque',
      visibility: 'public',
    });
    expect(integrationLeaveId).toBe('eventIdExample');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Calendar Event updated: John Doe: Vacaciones')
    );
  });
  //handleRemoveLeaveRequest(leaveRequest: LeaveRequest,integrationLeaveId: string): Promise<void>;
  it('Should remove Calendar event for leave request', async () => {
    await googleCalendarIntegrationService.handleRemoveLeaveRequest(
      mockLeaveRequests[0],
      'calendarEventId'
    );
    expect(calendarServiceMock.deleteEvent).toHaveBeenCalledWith(
      'calendarEventId'
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Event Calendar removed for cancelled leave request'
      )
    );
  });
  //formatNoUpdateNeededMessage(leaveRequest: LeaveRequest): string;
  it('Should format message for created leave request Calendar Event', () => {
    expect(
      googleCalendarIntegrationService.formatNoUpdateNeededMessage(
        mockLeaveRequests[0]
      )
    ).toBe(
      '📅 Event Calendar already exists for leave request: Doe John: Vacaciones'
    );
  });
});
