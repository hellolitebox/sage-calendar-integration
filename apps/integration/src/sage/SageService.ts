import axios from 'axios';
import type {
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

const FIRST_PART_OF_DAY_START_TIME = '09:00';
const SECOND_PART_OF_DAY_START_TIME = '14:00';
const DEFAULT_HOURS_TO_ADD = 4;
const DEFAULT_FULL_DAY_HOURS = 8;

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
  }

  async initialize() {
    try {
      await this.initializePoliciesMap();
      await this.initializeEmployeesMap();
    } catch (error) {
      console.error('Error during initialization:', error);
    }
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

  private calculateEndTime(startTime: string, hoursToAdd: number): string {
    const [startHours, startMinutes] = startTime.split(':').map(Number);

    const addHours = Math.floor(hoursToAdd); // The whole hours part
    const addMinutes = (hoursToAdd - addHours) * 60; // The minutes part, from the decimal

    let endHours = startHours + addHours;
    let endMinutes = startMinutes + addMinutes;

    // Handle any overflow from minutes to hours
    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60); // Add any extra hours from minutes
      endMinutes = endMinutes % 60; // Remainder is the new minutes
    }

    // Handle if hours go past 24
    endHours = endHours % 24;

    const formattedEndTime = `${endHours
      .toString()
      .padStart(2, '0')}:${endMinutes.toFixed(0).padStart(2, '0')}`;

    return formattedEndTime;
  }

  private convertLeaveRequest(leaveRequest: SageHrLeaveRequest): LeaveRequest {
    let startTime = leaveRequest.start_time;
    let endTime = leaveRequest.end_time;
    const hoursToAdd = leaveRequest.is_part_of_day
      ? leaveRequest.hours || DEFAULT_HOURS_TO_ADD
      : leaveRequest.hours;

    let isSingleDay = leaveRequest.is_single_day;
    let isPartOfDay = leaveRequest.is_part_of_day;
    // Fix inconsistency in is_single_day and is_part_of_day
    if (
      leaveRequest.is_single_day &&
      leaveRequest.hours != null &&
      leaveRequest.hours < DEFAULT_FULL_DAY_HOURS
    ) {
      isSingleDay = false;
      isPartOfDay = true;
    }

    if (leaveRequest.first_part_of_day) {
      startTime =
        process.env.FIRST_PART_OF_DAY_START_TIME ||
        FIRST_PART_OF_DAY_START_TIME;
      endTime = this.calculateEndTime(startTime, hoursToAdd);
    } else if (leaveRequest.second_part_of_day) {
      startTime =
        process.env.SECOND_PART_OF_DAY_START_TIME ||
        SECOND_PART_OF_DAY_START_TIME;
      endTime = this.calculateEndTime(startTime, hoursToAdd);
    }

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
      isSingleDay,
      isPartOfDay,
      firstPartOfDay: leaveRequest.first_part_of_day,
      secondPartOfDay: leaveRequest.second_part_of_day,
      startDate: leaveRequest.start_date,
      endDate: leaveRequest.end_date,
      requestDate: leaveRequest.request_date,
      approvalDate: leaveRequest.approval_date
        ? leaveRequest.approval_date
        : null,
      hours: leaveRequest.hours || hoursToAdd,
      specificTime: leaveRequest.specific_time,
      startTime: startTime,
      endTime: endTime,
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
    allLeaveRequests = []
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
        this.convertLeaveRequest(leaveRequest)
      );
      const newAllRequests = allLeaveRequests.concat(pageData);
      const totalPages = response.data.meta.total_pages;

      if (page < totalPages) {
        return await this.fetchLeaveRequests(
          fromDate,
          toDate,
          page + 1,
          newAllRequests
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
        this.convertEmployee(employee)
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

  public getEmployeesMap(): Map<number, Employee> {
    return this.employeesMap;
  }
}
