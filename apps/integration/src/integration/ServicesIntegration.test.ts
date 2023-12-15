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
  .mockResolvedValueOnce([mockLeaveRequests[0]])
  .mockResolvedValueOnce([mockLeaveRequests[0]])
  .mockResolvedValueOnce([mockLeaveRequests[0]])
  .mockResolvedValueOnce([mockLeaveRequests[1]]);

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

describe('syncSageWithCalendar Tests', () => {
  let calendarServiceMock;
  let sageServiceMock;
  let sageLeaveEventScheduler: SageLeaveEventScheduler;
  let leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;

  beforeEach(() => {
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

  afterEach(() => {
    jest.clearAllMocks();
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
    ).toHaveBeenCalledWith(1);
    expect(calendarServiceMock.createEvent).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventsBySageIds
    ).toHaveBeenCalled();
  });

  it('should not duplicates Calendar Events for same leave requests', async () => {
    leaveRequestCalendarEventRepository = {
      ...leaveRequestCalendarEventRepository,
      findLeaveRequestCalendarEventBySageId: jest.fn(
        (sageLeaveRequestId: number) => {
          if (sageLeaveRequestId === 1) {
            return Promise.resolve([
              {
                id: 1,
                sageLeaveRequestId: 1,
                calendarEventId: 'test-event-id',
                startDateTime: new Date('2023-01-10T09:00'),
                endDateTime: new Date('2023-01-10T17:00'),
              },
            ]);
          } else {
            return Promise.resolve([]);
          }
        }
      ),
    };
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
    expect(calendarServiceMock.createEvent).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventsBySageIds
    ).toHaveBeenCalled();
  });

  it('should update Calendar Events for Leave request that has been updated', async () => {
    leaveRequestCalendarEventRepository = {
      ...leaveRequestCalendarEventRepository,
      findLeaveRequestCalendarEventBySageId: jest.fn(
        (sageLeaveRequestId: number) => {
          if (sageLeaveRequestId === 1) {
            return Promise.resolve([
              {
                id: 1,
                sageLeaveRequestId: 1,
                calendarEventId: 'test-event-id',
                startDateTime: new Date('2023-01-10T13:00'),
                endDateTime: new Date('2023-01-10T17:00'),
              },
            ]);
          } else {
            return Promise.resolve([]);
          }
        }
      ),
    };
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
    expect(calendarServiceMock.deleteEvent).toHaveBeenCalledWith(
      'test-event-id'
    );
    expect(calendarServiceMock.createEvent).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventsBySageIds
    ).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent
    ).toHaveBeenCalled();
  });

  it('should remove Calendar Events for Leave request that has been cancelled', async () => {
    leaveRequestCalendarEventRepository = {
      ...leaveRequestCalendarEventRepository,
      findLeaveRequestCalendarEventsBySageIds: jest.fn(
        (sageLeaveRequestIds: number[]) => {
          return Promise.resolve([
            {
              id: 2,
              sageLeaveRequestId: 2,
              calendarEventId: 'test-event-id',
              startDateTime: new Date('2023-01-10T13:00'),
              endDateTime: new Date('2023-01-10T17:00'),
            },
          ]);
        }
      ),
    };
    sageLeaveEventScheduler = new SageLeaveEventScheduler({
      calendarService: calendarServiceMock,
      sageService: sageServiceMock,
      leaveRequestCalendarEventRepository,
    });

    await sageLeaveEventScheduler.syncSageWithCalendar();

    expect(SageService.prototype.fetchLeaveRequests).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId
    ).not.toHaveBeenCalled();
    expect(calendarServiceMock.createEvent).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventsBySageIds
    ).toHaveBeenCalledWith([2]);
    expect(calendarServiceMock.deleteEvent).toHaveBeenCalledWith(
      'test-event-id'
    );
    expect(
      leaveRequestCalendarEventRepository.deleteLeaveRequestCalendarEvent
    ).toHaveBeenCalledWith(2);
  });
});
