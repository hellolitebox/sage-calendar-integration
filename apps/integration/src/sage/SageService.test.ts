jest.mock('axios');
import axios from 'axios';
import { SageService } from './SageService';
import { mockSageAPIPolicies } from './mock/mockPolicies';
import { mockSageAPIEmployees } from './mock/mockEmployees';
import { mockSageAPILeaveRequests } from './mock/mockLeaveRequest';

const mockedAxiosGet = axios.get as jest.Mock;

describe('SageService', () => {
  let sageService;

  beforeEach(() => {
    mockedAxiosGet.mockImplementation((url: string) => {
      if (url === 'https://example.com/api/leave-management/policies') {
        return Promise.resolve({ data: { data: mockSageAPIPolicies } });
      }
      if (url === 'https://example.com/api/employees') {
        return Promise.resolve({
          data: {
            data: mockSageAPIEmployees,
            meta: {
              total_pages: 1,
            },
          },
        });
      }
    });

    sageService = new SageService({
      sageDomain: 'https://example.com',
      sageApiKey: 'test-api-key',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with provided domain and API key', () => {
    expect(sageService.domain).toBe('https://example.com');
    expect(sageService.apiKey).toBe('test-api-key');
  });

  test('should fetch policies and convert them', async () => {
    const policies = await sageService.fetchPolicies();

    expect(mockedAxiosGet).toHaveBeenCalledWith(
      'https://example.com/api/leave-management/policies',
      expect.any(Object)
    );

    expect(policies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          color: expect.any(String),
          doNotAccrue: expect.any(Boolean),
          unit: expect.any(String),
          defaultAllowance: expect.any(String),
          maxCarryover: expect.any(String),
          accrueType: expect.any(String),
        }),
      ])
    );
  });

  test('should fetch all employees and convert them', async () => {
    const employees = await sageService.fetchEmployees();

    expect(mockedAxiosGet).toHaveBeenCalledWith(
      'https://example.com/api/employees',
      expect.any(Object)
    );

    expect(employees).toHaveLength(2);
  });

  test('fetchLeaveRequests handles errors', async () => {
    mockedAxiosGet.mockRejectedValue(new Error('Network error'));

    await expect(
      sageService.fetchLeaveRequests('2023-01-01', '2023-01-31')
    ).rejects.toThrow('Network error');
  });

  test('fetchLeaveRequests handles multiple pages', async () => {
    mockedAxiosGet
      .mockImplementationOnce((url: string) => {
        if (url.includes('leave-management/requests')) {
          return Promise.resolve({
            data: {
              data: mockSageAPILeaveRequests,
              meta: { total_pages: 2 },
            },
          });
        }
      })
      .mockImplementationOnce((url: string) => {
        if (url.includes('leave-management/requests')) {
          return Promise.resolve({
            data: {
              data: mockSageAPILeaveRequests,
              meta: { total_pages: 2 },
            },
          });
        }
      });

    const leaveRequests = await sageService.fetchLeaveRequests(
      '2023-01-01',
      '2023-01-31'
    );

    expect(leaveRequests).toHaveLength(2);
  });
});
