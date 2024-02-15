import type { LeaveRequest } from 'src/sage/SageServiceInterfaces';
import type { LeaveRequestCalendarEvent } from '../database/entities/LeaveRequestCalendarEventEntity';
import type {
  LeaveRequestCalendarEventData,
  LeaveRequestCalendarEventRepository,
} from '../database/entities/LeaveRequestCalendarEventDataSource';
import type { SageService } from '../sage/SageService';
import { areDateTimesEqual, getLeaveRequestDateTimes } from '../utils/dates';

const DAYS_TO_ADD = Number(process.env.LEAVE_REQUEST_QUERY_DAYS_RANGE) || 60;

export interface SageIntegrationService {
  handleCreateLeaveRequest(leaveRequest: LeaveRequest): Promise<string>;
  handleUpdateLeaveRequest(
    leaveRequest: LeaveRequest,
    integrationLeaveId: string
  ): Promise<string>;
  handleRemoveLeaveRequest(
    leaveRequest: LeaveRequest,
    integrationLeaveId: string
  ): Promise<void>;
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
      console.error(
        `Error while filtering leave requests\n${error.message || ''}`
      );
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
    service: SageIntegrationService,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent
  ) {
    const leaveRequestIntegrationId = await service.handleCreateLeaveRequest(
      leaveRequest
    );

    const leaveRequestIntegrationData = {
      calendarEventId: leaveRequestIntegrationId,
    };

    await this.leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent(
      leaveRequestCalendarEvent.id,
      leaveRequestIntegrationData
    );
  }

  private async updateExistingLeaveRequest(
    leaveRequest: LeaveRequest,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent,
    service: SageIntegrationService
  ) {
    const leaveRequestIntegrationId = await service.handleUpdateLeaveRequest(
      leaveRequest,
      leaveRequestCalendarEvent.calendarEventId
    );
    const { startDateTime, endDateTime } =
      getLeaveRequestDateTimes(leaveRequest);
    const baseIntegrationData: Partial<LeaveRequestCalendarEventData> = {
      startDateTime,
      endDateTime,
    };

    const leaveRequestIntegrationData = {
      ...baseIntegrationData,
      calendarEventId: leaveRequestIntegrationId,
    };

    await this.leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent(
      leaveRequestCalendarEvent.id,
      leaveRequestIntegrationData
    );
  }

  private isNewEvent(leaveRequestCalendarEvent: LeaveRequestCalendarEvent) {
    return Boolean(!leaveRequestCalendarEvent.calendarEventId);
  }

  async processAcceptedLeaveRequest(
    leaveRequest: LeaveRequest,
    service: SageIntegrationService,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent
  ) {
    if (this.isNewEvent(leaveRequestCalendarEvent)) {
      await this.handleNewLeaveRequest(
        leaveRequest,
        service,
        leaveRequestCalendarEvent
      );
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

  async processCancelledLeaveRequest(
    leaveRequest: LeaveRequest,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent,
    service: SageIntegrationService
  ) {
    try {
      if (!leaveRequestCalendarEvent.calendarEventId) {
        return;
      }
      await service.handleRemoveLeaveRequest(
        leaveRequest,
        leaveRequestCalendarEvent.calendarEventId
      );
    } catch (error) {
      console.error(
        `Error removing cancelled leave request\n${error.message || ''}`
      );
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
      let leaveRequestCalendarEvent =
        await this.leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId(
          leaveRequest.id
        );

      if (!leaveRequestCalendarEvent) {
        const { startDateTime, endDateTime } =
          getLeaveRequestDateTimes(leaveRequest);

        leaveRequestCalendarEvent =
          await this.leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent(
            {
              sageLeaveRequestId: leaveRequest.id,
              startDateTime,
              endDateTime,
            }
          );
      }
      for (const service of this.integrationServices) {
        this.processAcceptedLeaveRequest(
          leaveRequest,
          service,
          leaveRequestCalendarEvent
        );
      }
    }

    const cancelledLeaveRequests = await this.getCancelledLeaveRequests(
      allLeaveRequests
    );

    for (const leaveRequest of cancelledLeaveRequests) {
      const leaveRequestCalendarEvent =
        await this.leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId(
          leaveRequest.id
        );

      if (!leaveRequestCalendarEvent) {
        continue;
      }

      for (const service of this.integrationServices) {
        this.processCancelledLeaveRequest(
          leaveRequest,
          leaveRequestCalendarEvent,
          service
        );
      }
      await this.leaveRequestCalendarEventRepository.deleteLeaveRequestCalendarEvent(
        leaveRequestCalendarEvent.id
      );
    }
  }
}

export default SageLeaveEventScheduler;
