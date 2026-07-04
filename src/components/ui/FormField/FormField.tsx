import { Form, Input, InputNumber, Select, Switch, DatePicker } from 'antd'
import type { FormItemProps } from 'antd'
import type { FC, ReactNode } from 'react'

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'date' | 'custom'

interface SelectOption {
  label: string
  value: string | number
}

export interface FormFieldProps extends Omit<FormItemProps, 'children'> {
  fieldType?: FieldType
  placeholder?: string
  options?: SelectOption[]
  disabled?: boolean
  children?: ReactNode
}

export const FormField: FC<FormFieldProps> = ({
  fieldType = 'text',
  placeholder,
  options = [],
  disabled,
  children,
  ...formItemProps
}) => {
  const renderControl = () => {
    if (children) return children

    switch (fieldType) {
      case 'textarea':
        return <Input.TextArea placeholder={placeholder} disabled={disabled} rows={3} />
      case 'number':
        return <InputNumber placeholder={placeholder} disabled={disabled} style={{ width: '100%' }} />
      case 'select':
        return (
          <Select
            placeholder={placeholder}
            disabled={disabled}
            options={options}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        )
      case 'switch':
        return <Switch disabled={disabled} />
      case 'date':
        return <DatePicker disabled={disabled} style={{ width: '100%' }} />
      default:
        return <Input placeholder={placeholder} disabled={disabled} />
    }
  }

  return <Form.Item {...formItemProps}>{renderControl()}</Form.Item>
}
