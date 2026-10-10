import { DatePicker, Input, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useState, type FC } from 'react'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useCustomers } from '@/modules/masters/hooks/useCustomers'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ReportFilterKey, ReportFilters } from '@/types/api/reports'

const { RangePicker } = DatePicker

const TRANSACTION_TYPES = ['grn', 'issue', 'receipt', 'adjustment', 'transfer', 'opening']
const YES_NO = [
  { value: '1', label: 'Overdue only' },
  { value: '0', label: 'All' },
]

export interface ReportFilterBarProps {
  filterKeys: ReportFilterKey[]
  value: ReportFilters
  onChange: (next: ReportFilters) => void
}

/** The endpoints take these as free strings (status vocabularies differ per module,
 * and a wrong fixed list would silently filter everything out). Committing on Enter
 * or blur keeps it from refetching the report on every keystroke. */
const TextFilter: FC<{
  placeholder: string
  width: number
  value: string | undefined
  onCommit: (next: string | undefined) => void
}> = ({ placeholder, width, value, onCommit }) => {
  const [draft, setDraft] = useState(value ?? '')

  const commit = () => onCommit(draft.trim() === '' ? undefined : draft.trim())

  return (
    <Input
      allowClear
      placeholder={placeholder}
      style={{ width }}
      value={draft}
      onChange={e => {
        setDraft(e.target.value)
        // The clear button never fires blur, so emptying has to apply on the spot.
        if (e.target.value === '') onCommit(undefined)
      }}
      onPressEnter={commit}
      onBlur={commit}
    />
  )
}

export const ReportFilterBar: FC<ReportFilterBarProps> = ({ filterKeys, value, onChange }) => {
  const needsItems = filterKeys.includes('item_id')
  const needsLocations =
    filterKeys.includes('location_id') ||
    filterKeys.includes('from_location_id') ||
    filterKeys.includes('to_location_id')
  const needsCustomers = filterKeys.includes('party_id')
  const needsSuppliers = filterKeys.includes('supplier_id')

  // The pickers are only mounted when a report asks for them, but hooks can't be
  // conditional — TanStack's cache makes the unused ones effectively free.
  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: customers } = useCustomers()
  const { data: suppliers } = useSuppliers()

  const set = (key: keyof ReportFilters, next: string | undefined) =>
    onChange({ ...value, [key]: next })

  const options = (list: { id: string; code: string; name: string }[] | undefined) =>
    (list ?? []).map(o => ({ value: o.id, label: `${o.code} — ${o.name}` }))

  const picker = (key: 'location_id' | 'from_location_id' | 'to_location_id', label: string) => (
    <Select
      key={key}
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder={label}
      style={{ minWidth: 190 }}
      value={value[key]}
      onChange={v => set(key, v)}
      options={options(locations)}
    />
  )

  const hasDateRange = filterKeys.includes('from_date') || filterKeys.includes('to_date')

  return (
    <Space wrap style={{ marginBottom: 16 }}>
      {needsItems && (
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Item"
          style={{ minWidth: 240 }}
          value={value.item_id}
          onChange={v => set('item_id', v)}
          options={options(items)}
        />
      )}

      {needsLocations && filterKeys.includes('location_id') && picker('location_id', 'Location')}
      {needsLocations &&
        filterKeys.includes('from_location_id') &&
        picker('from_location_id', 'From location')}
      {needsLocations &&
        filterKeys.includes('to_location_id') &&
        picker('to_location_id', 'To location')}

      {needsCustomers && (
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Customer"
          style={{ minWidth: 220 }}
          value={value.party_id}
          onChange={v => set('party_id', v)}
          options={options(customers)}
        />
      )}

      {needsSuppliers && (
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Supplier"
          style={{ minWidth: 220 }}
          value={value.supplier_id}
          onChange={v => set('supplier_id', v)}
          options={options(suppliers)}
        />
      )}

      {filterKeys.includes('transaction_type') && (
        <Select
          allowClear
          placeholder="Transaction type"
          style={{ minWidth: 180 }}
          value={value.transaction_type}
          onChange={v => set('transaction_type', v)}
          options={TRANSACTION_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))}
        />
      )}

      {filterKeys.includes('overdue_only') && (
        <Select
          allowClear
          placeholder="Overdue"
          style={{ minWidth: 150 }}
          value={value.overdue_only}
          onChange={v => set('overdue_only', v)}
          options={YES_NO}
        />
      )}

      {filterKeys.includes('status') && (
        <TextFilter
          placeholder="Status"
          width={150}
          value={value.status}
          onCommit={v => set('status', v)}
        />
      )}

      {filterKeys.includes('review_status') && (
        <TextFilter
          placeholder="Review status"
          width={160}
          value={value.review_status}
          onCommit={v => set('review_status', v)}
        />
      )}

      {filterKeys.includes('document_type') && (
        <TextFilter
          placeholder="Document type"
          width={180}
          value={value.document_type}
          onCommit={v => set('document_type', v)}
        />
      )}

      {filterKeys.includes('job_card_id') && (
        <TextFilter
          placeholder="Job card ID"
          width={150}
          value={value.job_card_id}
          onCommit={v => set('job_card_id', v)}
        />
      )}

      {hasDateRange && (
        <RangePicker
          allowEmpty={[true, true]}
          value={[
            value.from_date ? dayjs(value.from_date) : null,
            value.to_date ? dayjs(value.to_date) : null,
          ]}
          onChange={range =>
            onChange({
              ...value,
              from_date: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
              to_date: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
            })
          }
        />
      )}
    </Space>
  )
}
