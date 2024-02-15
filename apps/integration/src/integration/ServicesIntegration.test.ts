import { SageService } from '../sage';
import { CalendarService } from '../calendar';
import { mockCalendarData } from '../calendar/mock/mockCalendarData';
import { mockCalendarEventResponse } from '../calendar/mock/mockCalendarEventResponse';
import type { LeaveRequestCalendarEventRepository } from '../database/entities/LeaveRequestCalendarEventDataSource';
import SageLeaveEventScheduler from './ServicesIntegration';
import { mockLeaveRequests } from '../sage/mock/mockLeaveRequest';
import mockLeaveRequestCalendarEventRepository from '../database/mock/leaveRequestCalendarEventRepositoryMock';
import type { LeaveRequest } from 'src/sage/SageServiceInterfaces';

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

class IntegrationServiceMock {
  handleCreateLeaveRequest = jest
    .fn()
    .mockImplementation((leaveRequest: LeaveRequest) => {
      return Promise.resolve('integrationServiceId');
    });

  handleUpdateLeaveRequest = jest
    .fn()
    .mockImplementation(
      (leaveRequest: LeaveRequest, integrationLeaveId: string) => {
        return Promise.resolve('newIntegrationServiceId');
      }
    );

  handleRemoveLeaveRequest = jest
    .fn()
    .mockImplementation(
      (leaveRequest: LeaveRequest, integrationLeaveId: string) => {
        return Promise.resolve();
      }
    );

  formatNoUpdateNeededMessage = jest
    .fn()
    .mockImplementation((leaveRequest: LeaveRequest) => {
      return `Integration Event already exist for ${leaveRequest.employee.lastName}`;
    });
}

describe('syncSageWithCalendar Tests', () => {
  let sageServiceMock;
  let sageLeaveEventScheduler: SageLeaveEventScheduler;
  let leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;
  let integrationServiceMock: IntegrationServiceMock;

  beforeEach(() => {
    leaveRequestCalendarEventRepository =
      mockLeaveRequestCalendarEventRepository;

    process.env.ENABLE_TEST_USERS_ALL = 'false';

    integrationServiceMock = new IntegrationServiceMock();

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
      sageService: sageServiceMock,
      leaveRequestCalendarEventRepository,
      integrationServices: [integrationServiceMock],
    });

    await sageLeaveEventScheduler.syncSageWithIntegrationServices();

    expect(SageService.prototype.fetchLeaveRequests).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId
    ).toHaveBeenCalledWith(1);
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).toHaveBeenCalled();
    expect(integrationServiceMock.handleCreateLeaveRequest).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent
    ).toHaveBeenCalled();
  });

  it('should not duplicates Calendar Events for same leave requests', async () => {
    leaveRequestCalendarEventRepository = {
      ...leaveRequestCalendarEventRepository,
      findLeaveRequestCalendarEventBySageId: jest.fn(
        (sageLeaveRequestId: number) => {
          if (sageLeaveRequestId === 1) {
            return Promise.resolve({
              id: 1,
              sageLeaveRequestId: 1,
              calendarEventId: 'test-event-id',
              startDateTime: new Date('2023-01-10T09:00'),
              endDateTime: new Date('2023-01-10T17:00'),
            });
          } else {
            return Promise.resolve(null);
          }
        }
      ),
    };
    sageLeaveEventScheduler = new SageLeaveEventScheduler({
      sageService: sageServiceMock,
      leaveRequestCalendarEventRepository,
      integrationServices: [integrationServiceMock],
    });

    await sageLeaveEventScheduler.syncSageWithIntegrationServices();

    expect(SageService.prototype.fetchLeaveRequests).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId
    ).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      integrationServiceMock.handleCreateLeaveRequest
    ).not.toHaveBeenCalled();
    expect(
      integrationServiceMock.handleUpdateLeaveRequest
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      integrationServiceMock.handleRemoveLeaveRequest
    ).not.toHaveBeenCalled();
  });

  it('should update Calendar Events for Leave request that has been updated', async () => {
    leaveRequestCalendarEventRepository = {
      ...leaveRequestCalendarEventRepository,
      findLeaveRequestCalendarEventBySageId: jest.fn(
        (sageLeaveRequestId: number) => {
          if (sageLeaveRequestId === 1) {
            return Promise.resolve({
              id: 1,
              sageLeaveRequestId: 1,
              calendarEventId: 'test-event-id',
              startDateTime: new Date('2023-01-10T13:00'),
              endDateTime: new Date('2023-01-10T17:00'),
            });
          } else {
            return Promise.resolve(null);
          }
        }
      ),
    };
    sageLeaveEventScheduler = new SageLeaveEventScheduler({
      sageService: sageServiceMock,
      leaveRequestCalendarEventRepository,
      integrationServices: [integrationServiceMock],
    });

    await sageLeaveEventScheduler.syncSageWithIntegrationServices();

    expect(SageService.prototype.fetchLeaveRequests).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId
    ).toHaveBeenCalled();
    expect(
      integrationServiceMock.handleCreateLeaveRequest
    ).not.toHaveBeenCalled();
    expect(integrationServiceMock.handleUpdateLeaveRequest).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent
    ).toHaveBeenCalled();
  });

  it('should remove Calendar Events for Leave request that has been cancelled', async () => {
    leaveRequestCalendarEventRepository = {
      ...leaveRequestCalendarEventRepository,
      findLeaveRequestCalendarEventBySageId: jest.fn(
        (sageLeaveRequestIds: number) => {
          return Promise.resolve({
            id: 2,
            sageLeaveRequestId: 2,
            calendarEventId: 'test-event-id',
            startDateTime: new Date('2023-01-10T13:00'),
            endDateTime: new Date('2023-01-10T17:00'),
          });
        }
      ),
    };
    sageLeaveEventScheduler = new SageLeaveEventScheduler({
      sageService: sageServiceMock,
      leaveRequestCalendarEventRepository,
      integrationServices: [integrationServiceMock],
    });

    await sageLeaveEventScheduler.syncSageWithIntegrationServices();

    expect(SageService.prototype.fetchLeaveRequests).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId
    ).toHaveBeenCalled();
    expect(
      integrationServiceMock.handleCreateLeaveRequest
    ).not.toHaveBeenCalled();
    expect(
      integrationServiceMock.handleUpdateLeaveRequest
    ).not.toHaveBeenCalled();
    expect(integrationServiceMock.handleRemoveLeaveRequest).toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent
    ).not.toHaveBeenCalled();
    expect(
      leaveRequestCalendarEventRepository.deleteLeaveRequestCalendarEvent
    ).toHaveBeenCalledWith(2);
  });
});
