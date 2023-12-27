import type { LeaveRequest } from 'src/sage/SageServiceInterfaces';
import type { EventUpsertData } from 'src/calendar/CalendarServiceInterfaces';
import type { LeaveRequestCalendarEvent } from '../database/entities/LeaveRequestCalendarEventEntity';
import { findTimeZoneByCountryCode } from '../tz-locales';
import type { LeaveRequestCalendarEventRepository } from '../database/entities/LeaveRequestCalendarEventDataSource';
import type { CalendarService } from '../calendar';
import type { SageService } from '../sage/SageService';

interface SageLeaveEventSchedulerConfig {
  calendarService: CalendarService;
  sageService: SageService;
  leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;
}

function areDateTimesEqual(dateTime1: Date, dateTimeAsString: string) {
  const dateTime2 = new Date(dateTimeAsString);

  return (
    dateTime1.getFullYear() === dateTime2.getFullYear() &&
    dateTime1.getMonth() === dateTime2.getMonth() &&
    dateTime1.getDate() === dateTime2.getDate() &&
    dateTime1.getHours() === dateTime2.getHours() &&
    dateTime1.getMinutes() === dateTime2.getMinutes()
  );
}

class SageLeaveEventScheduler {
  private calendarService: CalendarService;
  private sageService: SageService;
  private leaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository;

  constructor({
    calendarService,
    sageService,
    leaveRequestCalendarEventRepository,
  }: SageLeaveEventSchedulerConfig) {
    this.calendarService = calendarService;
    this.sageService = sageService;
    this.leaveRequestCalendarEventRepository =
      leaveRequestCalendarEventRepository;
  }

  getTestUsers(): number[] {
    return process.env.TEST_USERS
      ? process.env.TEST_USERS.split(',').map(Number)
      : [];
  }

  async getFilteredLeaveRequests(
    leaveRequests: LeaveRequest[],
    statusCode: string,
    filterTestUsers = false
  ) {
    const testUsers = filterTestUsers ? this.getTestUsers() : null;

    return leaveRequests.filter((leaveRequest) => {
      const isStatusMatch = leaveRequest.statusCode === statusCode;
      const isTestUser = filterTestUsers
        ? testUsers.includes(leaveRequest.employee.id)
        : true;

      return isStatusMatch && isTestUser;
    });
  }

  async getApprovedLeaveRequests(leaveRequests: LeaveRequest[]) {
    const filterTestUsers = process.env.ENABLE_TEST_USERS_ALL === 'true';
    return this.getFilteredLeaveRequests(
      leaveRequests,
      'approved',
      filterTestUsers
    );
  }

  async getCancelledLeaveRequests(leaveRequests: LeaveRequest[]) {
    const filterTestUsers = process.env.ENABLE_TEST_USERS_ALL === 'true';
    return this.getFilteredLeaveRequests(
      leaveRequests,
      'canceled',
      filterTestUsers
    );
  }

  async deleteObsoleteLeaveRequestCalendarEvent(
    obsoleteLeaveRequestCalendarEvent: LeaveRequestCalendarEvent[]
  ) {
    await Promise.all(
      obsoleteLeaveRequestCalendarEvent.map(
        async (event: LeaveRequestCalendarEvent) => {
          try {
            await this.calendarService.deleteEvent(event.calendarEventId);
            await this.leaveRequestCalendarEventRepository.deleteLeaveRequestCalendarEvent(
              event.id
            );
            console.log(
              `❌ Event Calendar removed for cancelled leave request id: ${event.sageLeaveRequestId}`
            );
          } catch (error) {
            console.error('Error deleting calendar event:', error);
          }
        }
      )
    );
  }

  createEventUpsertDataFromLeaveRequest(
    leaveRequest: LeaveRequest
  ): EventUpsertData {
    const timeZone = findTimeZoneByCountryCode(leaveRequest.employee.country);

    let start;
    let end;

    if (leaveRequest.startTime && leaveRequest.endTime) {
      start = {
        dateTime: `${leaveRequest.startDate}T${leaveRequest.startTime}:00`,
        timeZone,
      };
      end = {
        dateTime: `${leaveRequest.endDate}T${leaveRequest.endTime}:00`,
        timeZone,
      };
    } else {
      start = { date: leaveRequest.startDate, timeZone };
      end = { date: leaveRequest.endDate, timeZone };
    }

    const eventData: EventUpsertData = {
      visibility: 'public',
      transparency: 'opaque', // indicates that attendee will appear as busy
      summary: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}: ${leaveRequest.policy?.name}`,
      description: leaveRequest.details,
      attendees: [
        { email: leaveRequest.employee.email, responseStatus: 'accepted' },
      ],
      reminders: { useDefault: true },
      start,
      end,
    };

    return eventData;
  }

  async createCalendarEvent(leaveRequest: LeaveRequest) {
    try {
      const leaveCalendarEventData =
        this.createEventUpsertDataFromLeaveRequest(leaveRequest);
      const calendarEvent = await this.calendarService.createEvent(
        leaveCalendarEventData
      );

      const startDateTime = leaveRequest.startTime
        ? new Date(`${leaveRequest.startDate}T${leaveRequest.startTime}`)
        : new Date(leaveRequest.startDate);

      const endDateTime = leaveRequest.endTime
        ? new Date(`${leaveRequest.endDate}T${leaveRequest.endTime}`)
        : new Date(leaveRequest.endDate);

      await this.leaveRequestCalendarEventRepository.insertLeaveRequestCalendarEvent(
        {
          sageLeaveRequestId: leaveRequest.id,
          calendarEventId: calendarEvent.id,
          startDateTime,
          endDateTime,
        }
      );

      console.log(`✅ Calendar Event Created: ${calendarEvent.summary}`);
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  }

  async updateCalendarEvent(
    leaveRequest: LeaveRequest,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent
  ) {
    try {
      await this.calendarService.deleteEvent(
        leaveRequestCalendarEvent.calendarEventId
      );

      const leaveCalendarEventData =
        this.createEventUpsertDataFromLeaveRequest(leaveRequest);
      const calendarEvent = await this.calendarService.createEvent(
        leaveCalendarEventData
      );

      const startDateTime = leaveRequest.startTime
        ? new Date(`${leaveRequest.startDate}T${leaveRequest.startTime}`)
        : new Date(leaveRequest.startDate);

      const endDateTime = leaveRequest.endTime
        ? new Date(`${leaveRequest.endDate}T${leaveRequest.endTime}`)
        : new Date(leaveRequest.endDate);

      this.leaveRequestCalendarEventRepository.updateLeaveRequestCalendarEvent(
        leaveRequestCalendarEvent.id,
        {
          sageLeaveRequestId: leaveRequest.id,
          calendarEventId: calendarEvent.id,
          startDateTime,
          endDateTime,
        }
      );
      console.log(`🔁 Calendar Event updated: ${calendarEvent.summary}`);
    } catch (error) {
      console.error('Error updating calendar event:', error);
    }
  }

  shouldUpdateCalendarEvent(
    leaveRequest: LeaveRequest,
    leaveRequestCalendarEvent: LeaveRequestCalendarEvent
  ) {
    const startDateTimeStr = leaveRequest.startTime
      ? `${leaveRequest.startDate}T${leaveRequest.startTime}`
      : leaveRequest.startDate;

    const endDateTimeStr = leaveRequest.endTime
      ? `${leaveRequest.endDate}T${leaveRequest.endTime}`
      : leaveRequest.endDate;

    return (
      !areDateTimesEqual(
        leaveRequestCalendarEvent.startDateTime,
        startDateTimeStr
      ) ||
      !areDateTimesEqual(leaveRequestCalendarEvent.endDateTime, endDateTimeStr)
    );
  }

  async createOrUpdateCalendarEvents(leaveRequests: LeaveRequest[]) {
    await Promise.all(
      leaveRequests.map(async (leaveRequest: LeaveRequest) => {
        const [leaveRequestCalendarEvent] =
          await this.leaveRequestCalendarEventRepository.findLeaveRequestCalendarEventBySageId(
            leaveRequest.id
          );
        const isNewRequest = !leaveRequestCalendarEvent;

        if (isNewRequest) {
          await this.createCalendarEvent(leaveRequest);
        } else if (
          this.shouldUpdateCalendarEvent(
            leaveRequest,
            leaveRequestCalendarEvent
          )
        ) {
          await this.updateCalendarEvent(
            leaveRequest,
            leaveRequestCalendarEvent
          );
        } else {
          console.log(
            `📅 Event Calendar already exists for leave request: ${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}: ${leaveRequest.policy?.name}`
          );
        }
      })
    );
  }

  public async syncSageWithCalendar() {
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 60);

    const formattedFromDate = fromDate.toISOString().split('T')[0];
    const formattedToDate = toDate.toISOString().split('T')[0];

    const allLeaveRequests = await this.sageService.fetchLeaveRequests(
      formattedFromDate,
      formattedToDate
    );

    const approvedLeaveRequests = await this.getApprovedLeaveRequests(
      allLeaveRequests
    );

    await this.createOrUpdateCalendarEvents(approvedLeaveRequests);

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

    await this.deleteObsoleteLeaveRequestCalendarEvent(obsoleteEvents);
  }
}

export default SageLeaveEventScheduler;
