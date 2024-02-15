import { InitCron } from './cron';
import * as cron from 'node-cron';
import { google } from 'googleapis';
import SageLeaveEventScheduler from '../integration/ServicesIntegration';

jest.mock('node-cron', () => {
  return {
    schedule: jest.fn(),
  };
});

jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn().mockImplementation(() => ({})),
    auth: {
      JWT: jest.fn(),
    },
  },
}));
jest.mock('../integration/ServicesIntegration');
jest.mock('../database/entities/LeaveRequestCalendarEventDataSource');
jest.mock('../sage');
jest.mock('../calendar');

SageLeaveEventScheduler.prototype.syncSageWithIntegrationServices = jest
  .fn()
  .mockResolvedValue({});

describe('InitCron', () => {
  beforeEach(() => {
    process.env.SAGE_DOMAIN = 'test-domain';
    process.env.SAGE_API_KEY = 'test-api-key';
    process.env.GOOGLE_CALENDAR_CREDENTIALS = JSON.stringify({
      client_email: 'test-email',
      private_key: 'test-key',
    });
    process.env.GOOGLE_CALENDAR_ID = 'test-calendar-id';
    process.env.GOOGLE_CALENDAR_SUBJECT_EMAIL = 'test-email-subject';
    process.env.SYNC_SAGE_CALENDAR_CRON_SCHEDULE = '*/20 * * * * *';
  });

  it('should schedule a cron job using the specified schedule', () => {
    InitCron();

    expect(cron.schedule).toHaveBeenCalledWith(
      process.env.SYNC_SAGE_CALENDAR_CRON_SCHEDULE,
      expect.any(Function),
      { name: 'sage calendar sync' }
    );
  });

  it('should invoke sageLeaveEventScheduler.syncSageWithCalendar when the cron job is executed', async () => {
    const logSpy = jest.spyOn(console, 'log');
    let callbackFunction;

    cron.schedule.mockImplementation((frequency, callback) => {
      callbackFunction = callback;
    });

    InitCron();

    await callbackFunction();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Starting sync at')
    );
    expect(
      SageLeaveEventScheduler.prototype.syncSageWithIntegrationServices
    ).toHaveBeenCalled();
  });
});
