import 'dotenv/config';
import cron from 'node-cron';

import { AppDataSource } from './database/AppDataSource';
import { syncSageWithCalendar } from './integration/ServicesIntegration';

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

cron.schedule(
  process.env.SYNC_SAGE_CALENDAR_CRON_SCHEDULE,
  async () => {
    console.log(`\n🏁 Starting sync at ${new Date().toLocaleString()}...`);

    await syncSageWithCalendar();

    console.log(`🛑 Sync is finished at ${new Date().toLocaleString()}\n`);
  },
  {
    name: 'sage calendar sync',
  },
);
