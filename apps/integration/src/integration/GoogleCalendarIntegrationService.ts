import type { LeaveRequest } from '../sage/SageServiceInterfaces';
import type { SageIntegrationService } from './ServicesIntegration';
import type { CalendarService } from '../calendar';
import type { EventUpsertData } from '../calendar/CalendarServiceInterfaces';
import { findTimeZoneByCountryCode } from '../tz-locales';

export class GoogleCalendarIntegrationService
  implements SageIntegrationService
{
  private calendarService: CalendarService;

  constructor(calendarService: CalendarService) {
    this.calendarService = calendarService;
  }

  private createEventUpsertDataFromLeaveRequest(
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

      if (leaveRequest.isMultiDate) {
        const endDate = new Date(leaveRequest.endDate);
        endDate.setDate(endDate.getDate() + 1); // Add one day

        // Convert back to YYYY-MM-DD format
        const adjustedEndDate = endDate.toISOString().split('T')[0];

        end = { date: adjustedEndDate, timeZone };
      } else {
        end = { date: leaveRequest.endDate, timeZone };
      }
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

  async handleCreateLeaveRequest(leaveRequest: LeaveRequest): Promise<string> {
    try {
      const leaveCalendarEventData =
        this.createEventUpsertDataFromLeaveRequest(leaveRequest);
      const calendarEvent = await this.calendarService.createEvent(
        leaveCalendarEventData
      );

      console.log(`✅ Calendar Event Created: ${calendarEvent.summary}`);
      return calendarEvent.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  }

  async handleUpdateLeaveRequest(
    leaveRequest: LeaveRequest,
    integrationLeaveId: string
  ): Promise<string> {
    try {
      await this.calendarService.deleteEvent(integrationLeaveId);

      const leaveCalendarEventData =
        this.createEventUpsertDataFromLeaveRequest(leaveRequest);
      const calendarEvent = await this.calendarService.createEvent(
        leaveCalendarEventData
      );
      console.log(`🔁 Calendar Event updated: ${calendarEvent.summary}`);
      return calendarEvent.id;
    } catch (error) {
      console.error('Error updating calendar event:', error);
    }
  }

  async handleRemoveLeaveRequest(
    leaveRequest: LeaveRequest,
    integrationLeaveId: string
  ) {
    try {
      await this.calendarService.deleteEvent(integrationLeaveId);
      console.log(
        `❌ Event Calendar removed for cancelled leave request: ${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName} - ${leaveRequest.policy.name}`
      );
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  }

  formatNoUpdateNeededMessage(leaveRequest: LeaveRequest): string {
    return `📅 Event Calendar already exists for leave request: ${leaveRequest.employee.lastName} ${leaveRequest.employee.firstName}: ${leaveRequest.policy?.name}`;
  }
}
