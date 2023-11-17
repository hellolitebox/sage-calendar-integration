import axios from 'axios';

export class SageService {
  private domain: string;

  constructor(sageDomain: string) {
    this.domain = sageDomain;
  }

  async fetchLeaveRequests(fromDate: string, toDate: string) {
    const url = `${this.domain}/api/leave-management/requests`;

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Auth-Token': process.env.SAGE_API_KEY,
    };

    try {
      const response = await axios.get(url, {
        headers,
        params: { fromDate, toDate },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leave management requests:', error);
      throw error;
    }
  }

  async fetchPolicies() {
    const url = `${this.domain}/api/leave-management/policies`;

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Auth-Token': process.env.SAGE_API_KEY,
    };

    try {
      const response = await axios.get(url, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leave management requests:', error);
      throw error;
    }
  }
}
