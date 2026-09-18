import { useCustomers } from '@/modules/masters/hooks/useCustomers'

// Every sales service guards with `role = customer AND status = 1`, so an
// inactive customer is rejected server-side with a validation error. Filtering
// here keeps those rows out of the pickers instead of surfacing that error
// only after the user has filled in a whole document.
export function useSalesCustomers() {
  const { data: customers = [], isLoading } = useCustomers()

  return {
    data: customers.filter(customer => customer.status === 'active'),
    isLoading,
  }
}
