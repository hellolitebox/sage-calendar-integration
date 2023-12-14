import type {
  LeaveRequestCalendarEventRepository,
  LeaveRequestCalendarEventData,
} from '../entities/LeaveRequestCalendarEventDataSource';
import type { LeaveRequestCalendarEvent } from '../entities/LeaveRequestCalendarEventEntity';

const mockLeaveRequestCalendarEvent: LeaveRequestCalendarEvent = {
  id: 1,
  sageLeaveRequestId: 123,
  calendarEventId: 'event-456',
  startDateTime: new Date('2023-01-01T09:00:00Z'),
  endDateTime: new Date('2023-01-01T17:00:00Z'),
};

const mockLeaveRequestCalendarEventRepository: LeaveRequestCalendarEventRepository =
  {
    insertLeaveRequestCalendarEvent: jest.fn().mockResolvedValue({}),

    getLeaveRequestCalendarEvents: jest.fn(
      async (): Promise<LeaveRequestCalendarEvent[]> => [
        mockLeaveRequestCalendarEvent,
      ]
    ),

    findLeaveRequestCalendarEventsByDateRange: jest.fn(
      async (
        fromDate: Date,
        toDate: Date
      ): Promise<LeaveRequestCalendarEvent[]> => [mockLeaveRequestCalendarEvent]
    ),

    updateLeaveRequestCalendarEvent: jest.fn(
      async (
        id: number,
        updateData: Partial<LeaveRequestCalendarEventData>
      ): Promise<void> => {}
    ),

    deleteLeaveRequestCalendarEvent: jest.fn(
      async (id: number): Promise<void> => {}
    ),

    findLeaveRequestCalendarEventById: jest.fn(
      async (id: number): Promise<LeaveRequestCalendarEvent | null> => null
    ),

    findLeaveRequestCalendarEventBySageId: jest.fn().mockResolvedValue([]),

    findLeaveRequestCalendarEventsBySageIds: jest.fn().mockResolvedValue([]),
  };

export default mockLeaveRequestCalendarEventRepository;
