import * as cron from 'node-cron';

import { syncSageWithCalendar } from 'src/integration/ServicesIntegration';

export const InitCron = () => {
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
};
