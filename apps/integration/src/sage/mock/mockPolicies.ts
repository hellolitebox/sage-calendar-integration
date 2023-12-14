const mockSageAPIPolicies = [
  {
    id: 1,
    name: 'Vacaciones',
    color: '#3a7dd8',
    do_not_accrue: false,
    unit: 'days',
    default_allowance: '10.0',
    max_carryover: '10.0',
    accrue_type: 'yearly',
  },
  {
    id: 2,
    name: 'Licencia Paga Anual',
    color: '#d5761b',
    do_not_accrue: false,
    unit: 'days',
    default_allowance: '5.0',
    max_carryover: '0.0',
    accrue_type: 'yearly',
  },
  {
    id: 3,
    name: 'Enfermedad',
    color: '#00A03E',
    do_not_accrue: true,
    unit: 'days',
    default_allowance: '0.0',
    max_carryover: '0.0',
    accrue_type: 'no_tracking',
  },
];

const mockPolicies = [
  {
    id: 1,
    name: 'Vacaciones',
    color: '#3a7dd8',
    doNotAccrue: false,
    unit: 'days',
    defaultAllowance: '10.0',
    maxCarryover: '10.0',
    accrueType: 'yearly',
  },
  {
    id: 2,
    name: 'Licencia Paga Anual',
    color: '#d5761b',
    doNotAccrue: false,
    unit: 'days',
    defaultAllowance: '5.0',
    maxCarryover: '0.0',
    accrueType: 'yearly',
  },
  {
    id: 3,
    name: 'Enfermedad',
    color: '#00A03E',
    doNotAccrue: true,
    unit: 'days',
    defaultAllowance: '0.0',
    maxCarryover: '0.0',
    accrueType: 'no_tracking',
  },
];

export { mockSageAPIPolicies, mockPolicies };
