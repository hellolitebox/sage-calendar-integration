import { google } from 'googleapis';
import { readFileSync } from 'fs';
import {
  CalendarEventResponse,
  EventUpsertData,
} from './CalendarServiceInterfaces';

export default class CalendarService {
  private readonly calendar;

  constructor() {
    const serviceAccount = JSON.parse(
      readFileSync('src/calendar/service-account.json', 'utf8'),
    );

    const jwtClient = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/calendar'],
      'darce@litebox.ai',
    );

    this.calendar = google.calendar({ version: 'v3', auth: jwtClient });
  }

  async getEvents(calendarId: string): Promise<CalendarEventResponse[]> {
    const response = await this.calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items;
  }

  async getEvent(
    calendarId: string,
    eventId: string,
  ): Promise<CalendarEventResponse> {
    const response = await this.calendar.events.list({
      calendarId,
      iCalUID: `${eventId}@google.com`,
    });
    return response.data.items[0];
  }

  async createEvent(
    calendarId: string,
    event: EventUpsertData,
  ): Promise<CalendarEventResponse> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
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
    calendarId: string,
    eventId: string,
    updatedEvent: EventUpsertData,
  ): Promise<CalendarEventResponse> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent,
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<any> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return { success: true };
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
