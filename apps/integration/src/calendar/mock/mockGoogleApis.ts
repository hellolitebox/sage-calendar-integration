import { mockCalendarData } from './mockCalendarData';
import { mockEvent, mockListEventsResponse } from './mockEventData';

const mockGoogleApis = {
  google: {
    auth: {
      JWT: jest.fn().mockImplementation(() => ({
        authorize: jest.fn((callback) => callback(null, true)),
      })),
    },
    calendar: jest.fn().mockImplementation(() => ({
      calendars: {
        get: jest.fn(() => ({
          data: {
            ...mockCalendarData,
          },
        })),
      },
      events: {
        list: jest.fn(() => mockListEventsResponse),
        get: jest.fn(() => ({ data: mockEvent })),
        insert: jest.fn(({ requestBody }) => {
          return {
            data: {
              ...mockEvent,
              ...requestBody,
            },
          };
        }),
        update: jest.fn(({ requestBody }) => {
          return {
            data: {
              ...mockEvent,
              ...requestBody,
            },
          };
        }),
        delete: jest.fn(),
      },
    })),
  },
};

export default mockGoogleApis;
