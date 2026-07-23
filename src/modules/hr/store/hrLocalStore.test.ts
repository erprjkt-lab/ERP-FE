import { beforeEach, describe, expect, it } from 'vitest'
import { useHRLocalStore } from './hrLocalStore'

describe('useHRLocalStore', () => {
  beforeEach(() => {
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
  })

  describe('employeeExtras', () => {
    it('starts empty', () => {
      expect(useHRLocalStore.getState().employeeExtras).toEqual({})
    })

    it('setEmployeeExtra stores fields for a given employee id', () => {
      useHRLocalStore.getState().setEmployeeExtra('emp-1', { salary: 50000, currency: 'INR' })
      expect(useHRLocalStore.getState().employeeExtras['emp-1']).toEqual({
        salary: 50000,
        currency: 'INR',
      })
    })

    it('setEmployeeExtra merges into existing extras rather than replacing them', () => {
      useHRLocalStore.getState().setEmployeeExtra('emp-1', { salary: 50000 })
      useHRLocalStore.getState().setEmployeeExtra('emp-1', { location: 'Mumbai' })
      expect(useHRLocalStore.getState().employeeExtras['emp-1']).toEqual({
        salary: 50000,
        location: 'Mumbai',
      })
    })

    it('setEmployeeExtra does not affect other employees', () => {
      useHRLocalStore.getState().setEmployeeExtra('emp-1', { salary: 50000 })
      useHRLocalStore.getState().setEmployeeExtra('emp-2', { salary: 60000 })
      expect(useHRLocalStore.getState().employeeExtras['emp-1']).toEqual({ salary: 50000 })
      expect(useHRLocalStore.getState().employeeExtras['emp-2']).toEqual({ salary: 60000 })
    })

    it('removeEmployeeExtra deletes only the given employee', () => {
      useHRLocalStore.getState().setEmployeeExtra('emp-1', { salary: 50000 })
      useHRLocalStore.getState().setEmployeeExtra('emp-2', { salary: 60000 })
      useHRLocalStore.getState().removeEmployeeExtra('emp-1')
      expect(useHRLocalStore.getState().employeeExtras['emp-1']).toBeUndefined()
      expect(useHRLocalStore.getState().employeeExtras['emp-2']).toEqual({ salary: 60000 })
    })

    it('removeEmployeeExtra is a no-op for an id that was never set', () => {
      expect(() => useHRLocalStore.getState().removeEmployeeExtra('missing')).not.toThrow()
      expect(useHRLocalStore.getState().employeeExtras).toEqual({})
    })
  })

  describe('designationExtras', () => {
    it('setDesignationExtra stores the department link', () => {
      useHRLocalStore.getState().setDesignationExtra('des-1', { departmentId: 'dept-1' })
      expect(useHRLocalStore.getState().designationExtras['des-1']).toEqual({
        departmentId: 'dept-1',
      })
    })

    it('removeDesignationExtra deletes only the given designation', () => {
      useHRLocalStore.getState().setDesignationExtra('des-1', { departmentId: 'dept-1' })
      useHRLocalStore.getState().setDesignationExtra('des-2', { departmentId: 'dept-2' })
      useHRLocalStore.getState().removeDesignationExtra('des-1')
      expect(useHRLocalStore.getState().designationExtras['des-1']).toBeUndefined()
      expect(useHRLocalStore.getState().designationExtras['des-2']).toEqual({
        departmentId: 'dept-2',
      })
    })
  })
})
