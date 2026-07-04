import { create } from 'zustand'

interface HRState {
  selectedEmployeeId: string | null
  setSelectedEmployee: (id: string | null) => void
  employeeListFilters: {
    search: string
    status: string | null
    departmentId: string | null
  }
  setFilter: (key: keyof HRState['employeeListFilters'], value: string | null) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: HRState['employeeListFilters'] = {
  search: '',
  status: null,
  departmentId: null,
}

export const useHRStore = create<HRState>(set => ({
  selectedEmployeeId: null,
  setSelectedEmployee: id => set({ selectedEmployeeId: id }),
  employeeListFilters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set(state => ({
      employeeListFilters: { ...state.employeeListFilters, [key]: value },
    })),
  resetFilters: () => set({ employeeListFilters: DEFAULT_FILTERS }),
}))
