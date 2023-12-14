import { SageService } from '../sage';
import { CalendarService } from '../calendar';
import { mockCalendarData } from '../calendar/mock/mockCalendarData';
import { mockCalendarEventResponse } from '../calendar/mock/mockCalendarEventResponse';
import type { LeaveRequestCalendarEventRepository } from '../database/entities/LeaveRequestCalendarEventDataSource';
import SageLeaveEventScheduler from './ServicesIntegration';
import { mockLeaveRequests } from '../sage/mock/mockLeaveRequest';
import mockLeaveRequestCalendarEventRepository from '../database/mock/leaveRequestCalendarEventRepositoryMock';

jest.mock('../sage/SageService');
jest.mock('../calendar');
jest.mock('../database/entities/LeaveRequestCalendarEventDataSource');

// Sage Service Mocked functions
SageService.prototype.fetchLeaveRequests = jest
  .fn()
  .mockResolvedValue(mockLeaveRequests);

// Calendar Service Mocked functions
CalendarService.prototype.getCalendarById = jest
  .fn()
  .mockResolvedValue(mockCalendarData);

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

describe('syncSageWithCalendar Tests', () => {
  let calendarServiceMock;
  let sageServiceMock;
  let sageLeaveEventScheduler: SageLeaveEventScheduler;
  let leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.resetModules();

    leaveRequestCalendarEventRepository =
      mockLeaveRequestCalendarEventRepository;

    process.env.ENABLE_TEST_USERS_ALL = 'false';

    calendarServiceMock = new CalendarService({
      calendarId: 'test-calendar-id',
    });

    sageServiceMock = new SageService({
      sageDomain: 'https://example.com',
      sageApiKey: 'test-api-key',
    });
  });

  it('should handle the complete flow of syncing Sage with Calendar', async () => {
    sageLeaveEventScheduler = new SageLeaveEventScheduler({
      calendarService: calendarServiceMock,
      sageService: sageServiceMock,
      leaveRequestCalendarEventRepository,
    });

    await sageLeaveEventScheduler.syncSageWithCalendar();

    expect(SageService.prototype.fetchLeaveRequests).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId
    ).toHaveBeenCalled();
    expect(calendarServiceMock.createEvent).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventsBySageIds
    ).toHaveBeenCalled();
  });
});
