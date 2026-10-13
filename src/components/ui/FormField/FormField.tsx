import { DatePicker, Form, Input, InputNumber, Select, Switch, TimePicker } from 'antd'
import type { FormItemProps } from 'antd'
import type { FC, ReactNode } from 'react'
import { loadMoreRender } from '../loadMoreRender'

type FieldType =
  'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'switch' | 'date' | 'time' | 'custom'

interface SelectOption {
  label: string
  value: string | number
}

export interface FormFieldProps extends Omit<FormItemProps, 'children'> {
  fieldType?: FieldType
  placeholder?: string
  options?: SelectOption[]
  disabled?: boolean
  /** Set when the lookup behind `options` has more rows than were fetched —
   *  adds a "Load more" footer to the dropdown. See useLookupPaging. */
  hasMore?: boolean
  onLoadMore?: () => void
  loadingMore?: boolean
  children?: ReactNode
}

export const FormField: FC<FormFieldProps> = ({
  fieldType = 'text',
  placeholder,
  options = [],
  disabled,
  hasMore,
  onLoadMore,
  loadingMore,
  children,
  ...formItemProps
}) => {
  const popupRender = onLoadMore
    ? loadMoreRender(Boolean(hasMore), onLoadMore, loadingMore)
    : undefined

  const renderControl = () => {
    if (children) return children

    switch (fieldType) {
      case 'textarea':
        return <Input.TextArea placeholder={placeholder} disabled={disabled} rows={3} />
      case 'number':
        return (
          <InputNumber placeholder={placeholder} disabled={disabled} style={{ width: '100%' }} />
        )
      case 'select':
        return (
          <Select
            placeholder={placeholder}
            disabled={disabled}
            options={options}
            showSearch
            popupRender={popupRender}
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        )
      case 'multiselect':
        return (
          <Select
            mode="multiple"
            placeholder={placeholder}
            disabled={disabled}
            options={options}
            allowClear
            showSearch
            popupRender={popupRender}
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        )
      case 'switch':
        return <Switch disabled={disabled} />
      case 'date':
        return <DatePicker disabled={disabled} style={{ width: '100%' }} />
      case 'time':
        return <TimePicker disabled={disabled} style={{ width: '100%' }} format="HH:mm" />
      default:
        return <Input placeholder={placeholder} disabled={disabled} />
    }
  }

  return <Form.Item {...formItemProps}>{renderControl()}</Form.Item>
}
