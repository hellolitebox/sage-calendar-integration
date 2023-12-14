import * as cron from 'node-cron';
import { google } from 'googleapis';

import SageLeaveEventScheduler from '../integration/ServicesIntegration';
import * as leaveRequestCalendarEventRepository from '../database/entities/LeaveRequestCalendarEventDataSource';
import { SageService } from '../sage';
import { CalendarService } from '../calendar';

export const InitCron = () => {
  const sageService = new SageService({
    sageDomain: process.env.SAGE_DOMAIN,
    sageApiKey: process.env.SAGE_API_KEY,
  });

  // load the environment variable with keys
  const keysEnvVar = process.env.GOOGLE_CALENDAR_CREDENTIALS;
  if (!keysEnvVar) {
    throw new Error(
      'The $GOOGLE_CALENDAR_CREDENTIALS environment variable was not found!'
    );
  }

  const keys = JSON.parse(keysEnvVar);
  const calendarInstance = google.calendar({
    version: 'v3',
    auth: new google.auth.JWT(
      keys.client_email,
      null,
      keys.private_key,
      ['https://www.googleapis.com/auth/calendar'],
      process.env.GOOGLE_CALENDAR_SUBJECT_EMAIL
    ),
  });
  const calendarService = new CalendarService({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    calendarInstance,
  });

  const sageLeaveEventScheduler = new SageLeaveEventScheduler({
    sageService,
    calendarService,
    leaveRequestCalendarEventRepository,
  });

  cron.schedule(
    process.env.SYNC_SAGE_CALENDAR_CRON_SCHEDULE,
    async () => {
      console.log(`\n🏁 Starting sync at ${new Date().toLocaleString()}...`);

      await sageLeaveEventScheduler.syncSageWithCalendar();

      console.log(`🛑 Sync is finished at ${new Date().toLocaleString()}\n`);
    },
    {
      name: 'sage calendar sync',
    }
  );
};
