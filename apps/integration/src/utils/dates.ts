import type { LeaveRequest } from '../sage/SageServiceInterfaces';

export function areDateTimesEqual(dateTime1: Date, dateTime2: Date) {
  return (
    dateTime1.getFullYear() === dateTime2.getFullYear() &&
    dateTime1.getMonth() === dateTime2.getMonth() &&
    dateTime1.getDate() === dateTime2.getDate() &&
    dateTime1.getHours() === dateTime2.getHours() &&
    dateTime1.getMinutes() === dateTime2.getMinutes()
  );
}

export function getLeaveRequestDateTimes(leaveRequest: LeaveRequest): {
  startDateTime: Date;
  endDateTime: Date;
} {
  const startDateTime = leaveRequest.startTime
    ? new Date(`${leaveRequest.startDate}T${leaveRequest.startTime}`)
    : new Date(leaveRequest.startDate);

  const endDateTime = leaveRequest.endTime
    ? new Date(`${leaveRequest.endDate}T${leaveRequest.endTime}`)
    : new Date(leaveRequest.endDate);

  return { startDateTime, endDateTime };
}
