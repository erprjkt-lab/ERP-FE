import { beforeEach, describe, expect, it } from 'vitest'
import { useHRStore } from './hrStore'

describe('useHRStore', () => {
  beforeEach(() => {
    useHRStore.getState().setSelectedEmployee(null)
    useHRStore.getState().resetFilters()
  })

  it('starts with no selected employee and empty filters', () => {
    expect(useHRStore.getState().selectedEmployeeId).toBeNull()
    expect(useHRStore.getState().employeeListFilters).toEqual({
      search: '',
      status: null,
      departmentId: null,
    })
  })

  it('setSelectedEmployee updates the selected id', () => {
    useHRStore.getState().setSelectedEmployee('emp-1')
    expect(useHRStore.getState().selectedEmployeeId).toBe('emp-1')
  })

  it('setFilter updates a single filter key without touching the others', () => {
    useHRStore.getState().setFilter('search', 'jane')
    expect(useHRStore.getState().employeeListFilters).toEqual({
      search: 'jane',
      status: null,
      departmentId: null,
    })

    useHRStore.getState().setFilter('status', 'active')
    expect(useHRStore.getState().employeeListFilters).toEqual({
      search: 'jane',
      status: 'active',
      departmentId: null,
    })
  })

  it('resetFilters restores all filters to defaults', () => {
    useHRStore.getState().setFilter('search', 'jane')
    useHRStore.getState().setFilter('status', 'active')
    useHRStore.getState().setFilter('departmentId', 'dept-1')
    useHRStore.getState().resetFilters()
    expect(useHRStore.getState().employeeListFilters).toEqual({
      search: '',
      status: null,
      departmentId: null,
    })
  })
})
