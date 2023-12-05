import { google } from 'googleapis';
import type {
  CalendarEventResponse,
  CalendarServiceConfig,
  EventUpsertData,
  GetEventsParams,
} from './CalendarServiceInterfaces';

export default class CalendarService {
  private readonly calendar;

  private readonly calendarId: string;

  constructor({
    calendarId,
    clientEmail,
    accountPrivateKey,
    subjectEmail,
  }: CalendarServiceConfig) {
    this.calendarId = calendarId;
    try {
      const jwtClient = new google.auth.JWT(
        clientEmail,
        null,
        accountPrivateKey,
        ['https://www.googleapis.com/auth/calendar'],
        subjectEmail
      );
      this.calendar = google.calendar({ version: 'v3', auth: jwtClient });
    } catch (error) {
      console.log(error);
    }
  }

  async getCalendarById(calendarId: string) {
    try {
      const response = await this.calendar.calendars.get({
        calendarId,
      });
      return response.data;
    } catch (error) {
      console.log(`Error fetching calendar with ID ${calendarId}:`, error);
      return null;
    }
  }

  async getEvents(
    fromDate?: string,
    toDate?: string
  ): Promise<CalendarEventResponse[]> {
    try {
      const params: GetEventsParams = {
        calendarId: this.calendarId,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (fromDate) {
        params.timeMin = new Date(fromDate).toISOString();
      }
      if (toDate) {
        params.timeMax = new Date(toDate).toISOString();
      }

      const response = await this.calendar.events.list(params);
      return response.data.items;
    } catch (error) {
      console.log('Error fetching events:', error);
      return [];
    }
  }

  async getEvent(eventId: string): Promise<CalendarEventResponse> {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId,
      });
      return response.data;
    } catch (error) {
      console.log('Error fetching event:', error);
      throw error;
    }
  }

  async createEvent(event: EventUpsertData): Promise<CalendarEventResponse> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        sendUpdates: 'all',
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async updateEvent(
    eventId: string,
    updatedEvent: EventUpsertData
  ): Promise<CalendarEventResponse> {
    try {
      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId,
        requestBody: updatedEvent,
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteEvent(eventId: string): Promise<any> {
    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId,
      });
      return { success: true };
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
