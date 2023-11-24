import { DataSource } from 'typeorm';
import { LeaveRequestCalendarEvent } from './entities/LeaveRequestCalendarEventEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER_NAME,
  password: process.env.POSTGRES_PASSWORD,
  database: 'sage_calendar_integration',
  entities: [LeaveRequestCalendarEvent],
  synchronize: true,
});
