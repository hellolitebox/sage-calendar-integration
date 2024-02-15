import 'dotenv/config';
import { AppDataSource } from './database/AppDataSource';
import { InitCron } from './cron/cron';

async function main() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
    InitCron();
  } catch (err) {
    console.error('Error during Data Source initialization', err);
  }
}

main();
