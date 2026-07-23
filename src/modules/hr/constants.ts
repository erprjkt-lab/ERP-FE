export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Intern', value: 'intern' },
]

export const EMPLOYEE_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

// The backend stores `branch` as a bare integer id with no branches table
// behind it — this static list is the only definition of what those ids mean.
export const BRANCH_OPTIONS = [
  { label: 'Head Office', value: 1 },
  { label: 'Mumbai', value: 2 },
  { label: 'Delhi', value: 3 },
  { label: 'Bangalore', value: 4 },
]

export function getBranchLabel(branch?: number | null): string | undefined {
  return BRANCH_OPTIONS.find(option => option.value === branch)?.label
}
