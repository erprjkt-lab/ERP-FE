import { App, Form, Select } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import type { CustomerType, GstType } from '@/types/masters'
import {
  CUSTOMER_TYPE_OPTIONS,
  DEFAULT_COUNTRY_NAME,
  GST_REGEX,
  GST_TYPE_OPTIONS,
  IFSC_REGEX,
  MASTER_STATUS_OPTIONS,
  MOBILE_REGEX,
  PAN_REGEX,
  PAYMENT_TERMS_OPTIONS,
  PINCODE_REGEX,
} from '../constants'
import { useCities } from '../hooks/useCities'
import { useCountries } from '../hooks/useCountries'
import { useCreateCustomer, useCustomer, useUpdateCustomer } from '../hooks/useCustomers'
import { useStates } from '../hooks/useStates'
import type { CustomerInput } from '../store/mastersStore'
import { getErrorMessage } from '@/api/client'

// Two fields per row instead of the full-page form's one/three-column layout,
// so this long form fits a wide drawer without a long single-column scroll.
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }

export interface CustomerFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to add a new customer; pass an id to edit that customer. */
  customerId?: string
}

export const CustomerFormDrawer: FC<CustomerFormDrawerProps> = ({ open, onClose, customerId }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!customerId

  const { data: customer } = useCustomer(customerId)
  const countryId = Form.useWatch('countryId', form) as string | undefined
  const stateId = Form.useWatch('stateId', form) as string | undefined
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates(countryId)
  const { data: cities = [] } = useCities(stateId)
  const { mutateAsync: createCustomer, isPending: creating } = useCreateCustomer()
  const { mutateAsync: updateCustomer, isPending: updating } = useUpdateCustomer()

  const countryOptions = countries.map(c => ({ label: c.name, value: String(c.id) }))
  const stateOptions = states.map(s => ({ label: s.name, value: String(s.id) }))
  const cityOptions = cities.map(c => ({ label: c.name, value: String(c.id) }))

  useEffect(() => {
    if (!open) return
    if (isEdit && customer) {
      form.setFieldsValue({
        code: customer.code,
        name: customer.name,
        customerType: customer.customerType,
        status: customer.status,
        contactPerson: customer.contactPerson,
        mobile: customer.mobile,
        email: customer.email,
        website: customer.website,
        address: customer.address,
        countryId: customer.countryId ?? undefined,
        stateId: customer.stateId ?? undefined,
        cityId: customer.cityId ?? undefined,
        pincode: customer.pincode,
        gstNumber: customer.gstNumber,
        panNumber: customer.panNumber,
        gstType: customer.gstType,
        creditLimit: customer.creditLimit,
        creditDays: customer.creditDays,
        openingBalance: customer.openingBalance,
        paymentTerms: customer.paymentTerms,
        bankName: customer.bankName,
        bankBranch: customer.bankBranch,
        accountHolder: customer.accountHolder,
        accountNumber: customer.accountNumber,
        ifscCode: customer.ifscCode,
        upiId: customer.upiId,
      })
    } else if (!isEdit) {
      form.resetFields()
    }
    // customer is a freshly-composed object on every render (useCustomers
    // maps over the store array each call), so depending on it directly
    // would re-run this effect on every keystroke. Depend on the stable id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, customer?.id, form])

  useEffect(() => {
    if (!open || isEdit || form.getFieldValue('countryId')) return
    const india = countries.find(c => c.name === DEFAULT_COUNTRY_NAME)
    if (india) form.setFieldValue('countryId', String(india.id))
  }, [open, isEdit, countries, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    let values: Record<string, unknown>
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const payload = {
      name: values.name as string,
      customerType: (values.customerType as CustomerType | undefined) ?? null,
      status: values.status as 'active' | 'inactive',
      contactPerson: values.contactPerson as string,
      mobile: values.mobile as string,
      email: values.email as string,
      website: values.website as string | undefined,
      address: values.address as string,
      countryId: (values.countryId as string | undefined) ?? null,
      countryName: countryOptions.find(o => o.value === values.countryId)?.label,
      stateId: (values.stateId as string | undefined) ?? null,
      stateName: stateOptions.find(o => o.value === values.stateId)?.label,
      cityId: (values.cityId as string | undefined) ?? null,
      cityName: cityOptions.find(o => o.value === values.cityId)?.label,
      pincode: values.pincode as string,
      gstNumber: values.gstNumber as string | undefined,
      panNumber: values.panNumber as string | undefined,
      gstType: (values.gstType as GstType | undefined) ?? null,
      creditLimit: (values.creditLimit as number | undefined) ?? 0,
      creditDays: (values.creditDays as number | undefined) ?? 0,
      openingBalance: (values.openingBalance as number | undefined) ?? 0,
      paymentTerms: (values.paymentTerms as string | undefined) ?? null,
      bankName: values.bankName as string | undefined,
      bankBranch: values.bankBranch as string | undefined,
      accountHolder: values.accountHolder as string | undefined,
      accountNumber: values.accountNumber as string | undefined,
      ifscCode: values.ifscCode as string | undefined,
      upiId: values.upiId as string | undefined,
    } satisfies CustomerInput

    try {
      if (isEdit && customer) {
        await updateCustomer({ id: customer.id, payload })
      } else {
        await createCustomer(payload)
      }
      message.success(`Customer ${isEdit ? 'updated' : 'created'} successfully`)
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      status={isEdit ? (customer?.status ?? 'active') : undefined}
      open={open}
      width={720}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Update Customer' : 'Save Customer'}
    >
      <Form form={form} layout="vertical">
        <FormSection title="Basic Info">
          {isEdit && <FormField label="Customer Code" name="code" disabled />}
          <div style={gridStyle}>
            <FormField
              label="Customer Name"
              name="name"
              rules={[{ required: true, message: 'Customer name is required' }]}
            />
            <FormField
              label="Customer Type"
              name="customerType"
              fieldType="select"
              options={CUSTOMER_TYPE_OPTIONS}
            />
            <FormField
              label="Contact Person"
              name="contactPerson"
              rules={[{ required: true, message: 'Contact person is required' }]}
            />
            <FormField
              label="Mobile"
              name="mobile"
              rules={[
                { required: true, message: 'Mobile is required' },
                { pattern: MOBILE_REGEX, message: 'Enter a valid 10-digit mobile number' },
              ]}
            />
            <FormField
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
            />
            <FormField label="Website" name="website" />
            <FormField
              label="Status"
              name="status"
              fieldType="select"
              options={MASTER_STATUS_OPTIONS}
              initialValue="active"
            />
          </div>
        </FormSection>

        <FormSection title="Address">
          <FormField
            label="Address"
            name="address"
            fieldType="textarea"
            rules={[{ required: true, message: 'Address is required' }]}
          />
          <div style={gridStyle}>
            <Form.Item
              label="Country"
              name="countryId"
              rules={[{ required: true, message: 'Country is required' }]}
            >
              <Select
                placeholder="Select country"
                options={countryOptions}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={() => {
                  form.setFieldValue('stateId', undefined)
                  form.setFieldValue('cityId', undefined)
                }}
              />
            </Form.Item>
            <Form.Item
              label="State"
              name="stateId"
              rules={[{ required: true, message: 'State is required' }]}
            >
              <Select
                placeholder="Select state"
                options={stateOptions}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={() => form.setFieldValue('cityId', undefined)}
              />
            </Form.Item>
            <FormField
              label="City"
              name="cityId"
              fieldType="select"
              options={cityOptions}
              rules={[{ required: true, message: 'City is required' }]}
            />
            <FormField
              label="Pincode"
              name="pincode"
              rules={[{ pattern: PINCODE_REGEX, message: 'Enter a valid 6-digit pincode' }]}
            />
          </div>
        </FormSection>

        <FormSection title="Tax & Compliance">
          <div style={gridStyle}>
            <FormField
              label="GST Number"
              name="gstNumber"
              rules={[{ pattern: GST_REGEX, message: 'Enter a valid GSTIN' }]}
            />
            <FormField
              label="PAN Number"
              name="panNumber"
              rules={[{ pattern: PAN_REGEX, message: 'Enter a valid PAN' }]}
            />
            <FormField
              label="GST Type"
              name="gstType"
              fieldType="select"
              options={GST_TYPE_OPTIONS}
            />
          </div>
        </FormSection>

        <FormSection title="Financial Terms">
          <div style={gridStyle}>
            <FormField label="Credit Limit" name="creditLimit" fieldType="number" />
            <FormField label="Credit Days" name="creditDays" fieldType="number" />
            <FormField label="Opening Balance" name="openingBalance" fieldType="number" />
            <FormField
              label="Payment Terms"
              name="paymentTerms"
              fieldType="select"
              options={PAYMENT_TERMS_OPTIONS}
            />
          </div>
        </FormSection>

        <FormSection title="Banking">
          <div style={gridStyle}>
            <FormField label="Bank Name" name="bankName" />
            <FormField label="Branch" name="bankBranch" />
            <FormField label="Account Holder" name="accountHolder" />
            <FormField label="Account Number" name="accountNumber" />
            <FormField
              label="IFSC Code"
              name="ifscCode"
              rules={[{ pattern: IFSC_REGEX, message: 'Enter a valid IFSC code' }]}
            />
            <FormField label="UPI ID" name="upiId" />
          </div>
        </FormSection>
      </Form>
    </FormDrawer>
  )
}
