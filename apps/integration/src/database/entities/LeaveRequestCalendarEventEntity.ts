import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class LeaveRequestCalendarEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sageLeaveRequestId: number;

  @Column()
  calendarEventId: string;

  @Column('timestamp with time zone')
  startDateTime: Date;

  @Column('timestamp with time zone')
  endDateTime: Date;
}
