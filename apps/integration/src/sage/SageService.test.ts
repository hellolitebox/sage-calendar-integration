jest.mock('axios');
import axios from 'axios';
import { SageService } from './SageService';
import { mockSageAPIPolicies } from './mock/mockPolicies';
import { mockSageAPIEmployees } from './mock/mockEmployees';

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
});
