import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EmployeeExtra {
  salary?: number
  currency?: string
  location?: string
}

export interface DesignationExtra {
  departmentId?: string | null
}

interface HRLocalState {
  employeeExtras: Record<string, EmployeeExtra>
  designationExtras: Record<string, DesignationExtra>
  setEmployeeExtra: (employeeId: string, extra: Partial<EmployeeExtra>) => void
  removeEmployeeExtra: (employeeId: string) => void
  setDesignationExtra: (designationId: string, extra: Partial<DesignationExtra>) => void
  removeDesignationExtra: (designationId: string) => void
}

export const useHRLocalStore = create<HRLocalState>()(
  persist(
    set => ({
      employeeExtras: {},
      designationExtras: {},
      setEmployeeExtra: (employeeId, extra) =>
        set(state => ({
          employeeExtras: {
            ...state.employeeExtras,
            [employeeId]: { ...state.employeeExtras[employeeId], ...extra },
          },
        })),
      removeEmployeeExtra: employeeId =>
        set(state => {
          const next = { ...state.employeeExtras }
          delete next[employeeId]
          return { employeeExtras: next }
        }),
      setDesignationExtra: (designationId, extra) =>
        set(state => ({
          designationExtras: {
            ...state.designationExtras,
            [designationId]: { ...state.designationExtras[designationId], ...extra },
          },
        })),
      removeDesignationExtra: designationId =>
        set(state => {
          const next = { ...state.designationExtras }
          delete next[designationId]
          return { designationExtras: next }
        }),
    }),
    { name: 'erp-hr-local' },
  ),
)
