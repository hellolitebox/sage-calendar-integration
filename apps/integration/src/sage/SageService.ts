import axios from 'axios';
import {
  CustomField,
  Employee,
  LeaveRequest,
  Policy,
  Replacement,
  SageHrCustomField,
  SageHrEmployee,
  SageHrLeaveRequest,
  SageHrPolicy,
  SageHrReplacement,
  SageServiceConfig,
} from './SageServiceInterfaces';

export class SageService {
  private domain: string;

  private apiKey: string;

  private policiesMap: Map<number, Policy>;

  private employeesMap: Map<number, Employee>;

  constructor({ sageDomain, sageApiKey }: SageServiceConfig) {
    this.domain = sageDomain;
    this.apiKey = sageApiKey;
    this.policiesMap = new Map();
    this.employeesMap = new Map();
    this.initializePoliciesMap();
    this.initializeEmployeesMap();
  }

  private async initializePoliciesMap(): Promise<void> {
    try {
      const policies = await this.fetchPolicies();
      policies.forEach((policy: Policy) => {
        this.policiesMap.set(policy.id, policy);
      });
    } catch (error) {
      console.error('Error initializing policies map:', error);
    }
  }

  private async initializeEmployeesMap(): Promise<void> {
    try {
      const employees = await this.fetchEmployees();
      employees.forEach((employee: Employee) => {
        this.employeesMap.set(employee.id, employee);
      });
    } catch (error) {
      console.error('Error initializing employees map:', error);
    }
  }

  private convertLeaveRequest(leaveRequest: SageHrLeaveRequest): LeaveRequest {
    return {
      id: leaveRequest.id,
      status: leaveRequest.status,
      statusCode: leaveRequest.status_code,
      policy: this.policiesMap.get(leaveRequest.policy_id),
      employee: this.employeesMap.get(leaveRequest.employee_id),
      replacement: leaveRequest.replacement
        ? this.convertReplacement(leaveRequest.replacement)
        : undefined,
      details: leaveRequest.details,
      isMultiDate: leaveRequest.is_multi_date,
      isSingleDay: leaveRequest.is_single_day,
      isPartOfDay: leaveRequest.is_part_of_day,
      firstPartOfDay: leaveRequest.first_part_of_day,
      secondPartOfDay: leaveRequest.second_part_of_day,
      startDate: leaveRequest.start_date,
      endDate: leaveRequest.end_date,
      requestDate: leaveRequest.request_date,
      approvalDate: leaveRequest.approval_date
        ? leaveRequest.approval_date
        : null,
      hours: leaveRequest.hours,
      specificTime: leaveRequest.specific_time,
      startTime: leaveRequest.start_time,
      endTime: leaveRequest.end_time,
      childId: leaveRequest.child_id,
      sharedPersonName: leaveRequest.shared_person_name,
      sharedPersonNin: leaveRequest.shared_person_nin,
      fields:
        leaveRequest.fields.length > 0
          ? leaveRequest.fields.map(this.convertCustomField)
          : [],
    };
  }

  private convertReplacement(replacement: SageHrReplacement): Replacement {
    return {
      id: replacement.id,
      fullName: replacement.full_name,
    };
  }

  private convertCustomField(field: SageHrCustomField): CustomField {
    return {
      title: field.title,
      answer: field.answer,
    };
  }

  private convertPolicy(policy: SageHrPolicy): Policy {
    return {
      id: policy.id,
      name: policy.name,
      color: policy.color,
      doNotAccrue: policy.do_not_accrue,
      unit: policy.unit,
      defaultAllowance: policy.default_allowance,
      maxCarryover: policy.max_carryover,
      accrueType: policy.accrue_type,
    };
  }

  private convertEmployee(sageHrEmployee: SageHrEmployee): Employee {
    return {
      id: sageHrEmployee.id,
      email: sageHrEmployee.email,
      firstName: sageHrEmployee.first_name,
      lastName: sageHrEmployee.last_name,
      pictureUrl: sageHrEmployee.picture_url,
      employmentStartDate: sageHrEmployee.employment_start_date,
      dateOfBirth: sageHrEmployee.date_of_birth,
      team: sageHrEmployee.team,
      teamId: sageHrEmployee.team_id,
      position: sageHrEmployee.position,
      positionId: sageHrEmployee.position_id,
      reportsToEmployeeId: sageHrEmployee.reports_to_employee_id,
      workPhone: sageHrEmployee.work_phone,
      homePhone: sageHrEmployee.home_phone,
      mobilePhone: sageHrEmployee.mobile_phone,
      gender: sageHrEmployee.gender,
      streetFirst: sageHrEmployee.street_first,
      streetSecond: sageHrEmployee.street_second,
      city: sageHrEmployee.city,
      postCode: sageHrEmployee.post_code,
      country: sageHrEmployee.country,
      employeeNumber: sageHrEmployee.employee_number,
      employmentStatus: sageHrEmployee.employment_status,
      teamHistory: sageHrEmployee.team_history,
      employmentStatusHistory: sageHrEmployee.employment_status_history,
      positionHistory: sageHrEmployee.position_history,
    };
  }

  async fetchLeaveRequests(
    fromDate: string,
    toDate: string,
    page = 1,
    allLeaveRequests = [],
  ): Promise<LeaveRequest[]> {
    const url = `${this.domain}/api/leave-management/requests`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Auth-Token': this.apiKey,
    };

    try {
      const response = await axios.get(url, {
        headers,
        params: { from: fromDate, to: toDate, page },
      });

      const pageData = response.data.data.map((leaveRequest) =>
        this.convertLeaveRequest(leaveRequest),
      );
      const newAllRequests = allLeaveRequests.concat(pageData);
      const totalPages = response.data.meta.total_pages;

      if (page < totalPages) {
        return await this.fetchLeaveRequests(
          fromDate,
          toDate,
          page + 1,
          newAllRequests,
        );
      }

      return newAllRequests;
    } catch (error) {
      console.error('Error fetching leave management requests:', error);
      throw error;
    }
  }

  async fetchEmployees(page = 1, allEmployees = []): Promise<Employee[]> {
    const url = `${this.domain}/api/employees`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Auth-Token': this.apiKey,
    };

    try {
      const response = await axios.get(url, {
        headers,
        params: { page },
      });

      const pageData = response.data.data.map((employee) =>
        this.convertEmployee(employee),
      );
      const newAllEmployees = allEmployees.concat(pageData);
      const totalPages = response.data.meta.total_pages;

      if (page < totalPages) {
        return await this.fetchEmployees(page + 1, newAllEmployees);
      }

      return newAllEmployees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async fetchPolicies(): Promise<Policy[]> {
    const url = `${this.domain}/api/leave-management/policies`;

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Auth-Token': this.apiKey,
    };

    try {
      const response = await axios.get(url, {
        headers,
      });

      return response.data.data.map(this.convertPolicy);
    } catch (error) {
      console.error('Error fetching leave management requests:', error);
      throw error;
    }
  }
}
