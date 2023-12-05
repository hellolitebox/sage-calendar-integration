import 'dotenv/config';

import { AppDataSource } from './database/AppDataSource';

import { InitCron } from './cron/cron';

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

InitCron();
