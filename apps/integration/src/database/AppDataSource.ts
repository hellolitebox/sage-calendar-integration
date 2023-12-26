import 'dotenv/config';
import { DataSource } from 'typeorm';
import { LeaveRequestCalendarEvent } from './entities/LeaveRequestCalendarEventEntity';
import migrations from './migration';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER_NAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATA_BASE,
  entities: [LeaveRequestCalendarEvent],
  synchronize: false,
  migrations,
  migrationsTableName: 'migrations',
  migrationsRun: true,
});
