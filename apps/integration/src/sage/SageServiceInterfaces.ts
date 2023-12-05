export interface SageServiceConfig {
  sageDomain: string;
  sageApiKey: string;
}

export interface SageHrReplacement {
  id: number;
  full_name: string;
}

export interface SageHrCustomField {
  title: string;
  answer: string;
}

export interface SageHrLeaveRequest {
  id: number;
  status: string;
  status_code: string;
  policy_id: number;
  employee_id: number;
  replacement?: SageHrReplacement;
  details: string;
  is_multi_date: boolean;
  is_single_day: boolean;
  is_part_of_day: boolean;
  first_part_of_day: boolean;
  second_part_of_day: boolean;
  start_date: string;
  end_date: string;
  request_date: string;
  approval_date: string;
  hours: number;
  specific_time: boolean;
  start_time: string;
  end_time: string;
  child_id: number;
  shared_person_name: string;
  shared_person_nin: string;
  fields: SageHrCustomField[];
}

export interface LeaveRequest {
  id: number;
  status: string;
  statusCode: string;
  policy: Policy | undefined;
  employee: Employee;
  replacement: Replacement;
  details: string;
  isMultiDate: boolean;
  isSingleDay: boolean;
  isPartOfDay: boolean;
  firstPartOfDay: boolean;
  secondPartOfDay: boolean;
  startDate: string;
  endDate: string;
  requestDate: string;
  approvalDate: string | null;
  hours: number;
  specificTime: boolean;
  startTime: string;
  endTime: string;
  childId: number;
  sharedPersonName: string;
  sharedPersonNin: string;
  fields: CustomField[];
}

export interface Replacement {
  id: number;
  fullName: string;
}

export interface CustomField {
  title: string;
  answer: string;
}

export interface SageHrPolicy {
  id: number;
  name: string;
  color: string;
  do_not_accrue: boolean;
  unit: string;
  default_allowance: string;
  max_carryover: string;
  accrue_type: string;
}

export interface Policy {
  id: number;
  name: string;
  color: string;
  doNotAccrue: boolean;
  unit: string;
  defaultAllowance: string;
  maxCarryover: string;
  accrueType: string;
}
export interface Employee {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  pictureUrl: string;
  employmentStartDate: string;
  dateOfBirth: string;
  team: string;
  teamId: number;
  position: string;
  positionId: number;
  reportsToEmployeeId: number;
  workPhone: string;
  homePhone: string;
  mobilePhone: string;
  gender: string;
  streetFirst: string;
  streetSecond: string;
  city: string;
  postCode: number;
  country: string;
  employeeNumber: string;
  employmentStatus: string;
  teamHistory: unknown[];
  employmentStatusHistory: unknown[];
  positionHistory: unknown[];
}

export interface SageHrEmployee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  picture_url: string;
  employment_start_date: string;
  date_of_birth: string;
  team: string;
  team_id: number;
  position: string;
  position_id: number;
  reports_to_employee_id: number;
  work_phone: string;
  home_phone: string;
  mobile_phone: string;
  gender: string;
  street_first: string;
  street_second: string;
  city: string;
  post_code: number;
  country: string;
  employee_number: string;
  employment_status: string;
  team_history: unknown[];
  employment_status_history: unknown[];
  position_history: unknown[];
}
