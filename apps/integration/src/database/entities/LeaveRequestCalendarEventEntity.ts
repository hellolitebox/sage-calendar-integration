import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class LeaveRequestCalendarEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sageLeaveRequestId: number;

  @Column()
  calendarEventId: string;

  @Column()
  startDate: string;

  @Column()
  endDate: string;

  @Column({ nullable: true })
  startTime: string | null;

  @Column({ nullable: true })
  endTime: string | null;
}
