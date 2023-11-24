import { AppDataSource } from '../AppDataSource';
import { LeaveRequestCalendarEvent } from './LeaveRequestCalendarEventEntity';

export interface LeaveRequestCalendarEventData {
  sageLeaveRequestId: number;
  calendarEventId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

export async function insertLeaveRequestCalendarEvent(
  leaveRequestCalendarEventData: LeaveRequestCalendarEventData,
) {
  const eventRepository = AppDataSource.getRepository(
    LeaveRequestCalendarEvent,
  );
  const event = eventRepository.create(leaveRequestCalendarEventData);
  await eventRepository.save(event);
}

export async function getLeaveRequestCalendarEvents() {
  const eventRepository = AppDataSource.getRepository(
    LeaveRequestCalendarEvent,
  );
  return eventRepository.find();
}

export async function updateLeaveRequestCalendarEvent(
  id: number,
  updateData: Partial<LeaveRequestCalendarEventData>,
) {
  const eventRepository = AppDataSource.getRepository(
    LeaveRequestCalendarEvent,
  );
  await eventRepository.update(id, updateData);
}

export async function deleteLeaveRequestCalendarEvent(id: number) {
  const eventRepository = AppDataSource.getRepository(
    LeaveRequestCalendarEvent,
  );
  await eventRepository.delete(id);
}

export async function findLeaveRequestCalendarEventById(id: number) {
  const eventRepository = AppDataSource.getRepository(
    LeaveRequestCalendarEvent,
  );
  return eventRepository.findOneBy({ id });
}

export async function findLeaveRequestCalendarEventBySageId(
  sageLeaveRequestId: number,
) {
  const eventRepository = AppDataSource.getRepository(
    LeaveRequestCalendarEvent,
  );
  return eventRepository.findBy({ sageLeaveRequestId });
}
