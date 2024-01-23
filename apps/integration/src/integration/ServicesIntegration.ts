import type { LeaveRequest } from 'src/sage/SageServiceInterfaces';
import type { LeaveRequestCalendarEvent } from '../database/entities/LeaveRequestCalendarEventEntity';
import type { LeaveRequestCalendarEventRepository } from '../database/entities/LeaveRequestCalendarEventDataSource';
import type { SageService } from '../sage/SageService';
import { areDateTimesEqual, getLeaveRequestDateTimes } from '../utils/dates';

const DAYS_TO_ADD = 60;

export interface SageIntegrationService {
  handleCreateLeaveRequest(leaveRequest: LeaveRequest): Promise<string>;
  handleUpdateLeaveRequest(
    leaveRequest: LeaveRequest,
    integrationLeaveId: string
  ): Promise<string>;
  handleRemoveLeaveRequest(integrationLeaveId: string): Promise<void>;
  formatNoUpdateNeededMessage(leaveRequest: LeaveRequest): string;
}

interface SageLeaveEventSchedulerConfig {
  integrationServices: SageIntegrationService[];
  sageService: SageService;
  leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;
}

class SageLeaveEventScheduler {
  private integrationServices: SageIntegrationService[];
  private sageService: SageService;
  private leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;

  constructor({
    integrationServices,
    sageService,
    leaveRequestCalendarEventRepository,
  }: SageLeaveEventSchedulerConfig) {
    this.integrationServices = integrationServices;
    this.sageService = sageService;
    this.leaveRequestCalendarEventRepository =
      leaveRequestCalendarEventRepository;
  }

  getTestUsers(): number[] {
    return process.env.TEST_USERS
      ? process.env.TEST_USERS.split(',').map(Number)
      : [];
  }

  getFilteredLeaveRequests(
    leaveRequests: LeaveRequest[],
    statusCode: string,
    filterTestUsers = false
  ) {
    try {
      const testUsers = filterTestUsers ? this.getTestUsers() : null;

      return leaveRequests.filter((leaveRequest) => {
        const isStatusMatch = leaveRequest.statusCode === statusCode;
        const isTestUser = filterTestUsers
          ? leaveRequest.employee &&
            testUsers.includes(leaveRequest.employee.id)
          : true;

        return isStatusMatch && isTestUser;
      });
    } catch (error) {
      console.error('Error while filtering leave requests:', error);
      return [];
    }
  }

  getApprovedLeaveRequests(leaveRequests: LeaveRequest[]) {
    const filterTestUsers = process.env.ENABLE_TEST_USERS_ALL === 'true';
    return this.getFilteredLeaveRequests(
      leaveRequests,
      'approved',
      filterTestUsers
    );
  }

  getCancelledLeaveRequests(leaveRequests: LeaveRequest[]) {
    const filterTestUsers = process.env.ENABLE_TEST_USERS_ALL === 'true';
    return this.getFilteredLeaveRequests(
      leaveRequests,
      'canceled',
      filterTestUsers
    );
  }

  hasChangesToReflect(
    leaveRequest: LeaveRequest,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent
  ) {
    const { startDateTime, endDateTime } =
      getLeaveRequestDateTimes(leaveRequest);

    return (
      !areDateTimesEqual(
        leaveRequestCalendarEvent.startDateTime,
        startDateTime
      ) ||
      !areDateTimesEqual(leaveRequestCalendarEvent.endDateTime, endDateTime)
    );
  }

  private async handleNewLeaveRequest(
    leaveRequest: LeaveRequest,
    service: SageIntegrationService
  ) {
    const { startDateTime, endDateTime } =
      getLeaveRequestDateTimes(leaveRequest);

    const leaveRequestIntegrationId = await service.handleCreateLeaveRequest(
      leaveRequest
    );

    await this.leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent(
      {
        sageLeaveRequestId: leaveRequest.id,
        calendarEventId: leaveRequestIntegrationId,
        startDateTime,
        endDateTime,
      }
    );
  }

  private async updateExistingLeaveRequest(
    leaveRequest: LeaveRequest,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent,
    service: SageIntegrationService
  ) {
    const { startDateTime, endDateTime } =
      getLeaveRequestDateTimes(leaveRequest);

    const leaveRequestIntegrationId = await service.handleUpdateLeaveRequest(
      leaveRequest,
      leaveRequestCalendarEvent.calendarEventId
    );

    this.leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent(
      leaveRequestCalendarEvent.id,
      {
        calendarEventId: leaveRequestIntegrationId,
        startDateTime,
        endDateTime,
      }
    );
  }

  async processAcceptedLeaveRequest(leaveRequest) {
    for (const service of this.integrationServices) {
      const leaveRequestCalendarEvent =
        await this.leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId(
          leaveRequest.id
        );
      if (!leaveRequestCalendarEvent) {
        await this.handleNewLeaveRequest(leaveRequest, service);
      } else if (
        this.hasChangesToReflect(leaveRequest, leaveRequestCalendarEvent)
      ) {
        await this.updateExistingLeaveRequest(
          leaveRequest,
          leaveRequestCalendarEvent,
          service
        );
      } else {
        console.log(service.formatNoUpdateNeededMessage(leaveRequest));
      }
    }
  }

  async processCancelledLeaveRequest(cancelledLeaveRequest) {
    for (const service of this.integrationServices) {
      try {
        await service.handleRemoveLeaveRequest(
          cancelledLeaveRequest.calendarEventId
        );
        await this.leaveRequestCalendarEventRepository.deleteLeaveRequestCalendarEvent(
          cancelledLeaveRequest.id
        );
      } catch (error) {
        console.error('Error removing cancelled leave request:', error);
      }
    }
  }

  public async syncSageWithIntegrationServices() {
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + DAYS_TO_ADD);

    const formattedFromDate = fromDate.toISOString().split('T')[0];
    const formattedToDate = toDate.toISOString().split('T')[0];

    const allLeaveRequests = await this.sageService.fetchLeaveRequests(
      formattedFromDate,
      formattedToDate
    );

    const approvedLeaveRequests =
      this.getApprovedLeaveRequests(allLeaveRequests);

    for (const leaveRequest of approvedLeaveRequests) {
      await this.processAcceptedLeaveRequest(leaveRequest);
    }

    const cancelledLeaveRequests = await this.getCancelledLeaveRequests(
      allLeaveRequests
    );

    const cancelledLeaveRequestIds = cancelledLeaveRequests.map(
      (cancelledLeaveRequest: LeaveRequest) => cancelledLeaveRequest.id
    );

    const obsoleteEvents =
      await this.leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventsBySageIds(
        cancelledLeaveRequestIds
      );

    for (const event of obsoleteEvents) {
      await this.processCancelledLeaveRequest(event);
    }
  }
}

export default SageLeaveEventScheduler;
