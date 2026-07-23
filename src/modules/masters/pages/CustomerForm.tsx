import { App, Button, Card, Divider, Form, Select, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import type { CustomerType, GstType } from '@/types/masters'
import {
  CUSTOMER_TYPE_OPTIONS,
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

export const CustomerForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: customer } = useCustomer(id)
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates()
  const { data: cities = [] } = useCities()
  const { mutateAsync: createCustomer, isPending: creating } = useCreateCustomer()
  const { mutateAsync: updateCustomer, isPending: updating } = useUpdateCustomer()

  const countryId = Form.useWatch('countryId', form)
  const stateId = Form.useWatch('stateId', form)

  useEffect(() => {
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
    }
    // customer is a freshly-composed object on every render (useCustomers
    // maps over the store array each call), so depending on it directly
    // would re-run this effect — and stomp in-progress edits — on every
    // keystroke. Depend on the stable id instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, customer?.id, form])

  const countryOptions = countries.map(c => ({ label: c.name, value: c.id }))
  const stateOptions = states
    .filter(s => !countryId || s.countryId === countryId)
    .map(s => ({ label: s.name, value: s.id }))
  const cityOptions = cities
    .filter(c => !stateId || c.stateId === stateId)
    .map(c => ({ label: c.name, value: c.id }))

  const handleFinish = async (values: Record<string, unknown>) => {
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
      stateId: (values.stateId as string | undefined) ?? null,
      cityId: (values.cityId as string | undefined) ?? null,
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
      navigate('/masters/customers')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Customer' : 'Add Customer'}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Customers', href: '/masters/customers' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/masters/customers')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Customer
            </Button>
          </Space>
        }
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ maxWidth: 900 }}>
          <Typography.Title level={5}>Basic Info</Typography.Title>
          {isEdit && <FormField label="Customer Code" name="code" disabled />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
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

          <Divider />
          <Typography.Title level={5}>Address</Typography.Title>
          <FormField
            label="Address"
            name="address"
            fieldType="textarea"
            rules={[{ required: true, message: 'Address is required' }]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
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
          </div>
          <FormField
            label="Pincode"
            name="pincode"
            rules={[{ pattern: PINCODE_REGEX, message: 'Enter a valid 6-digit pincode' }]}
          />

          <Divider />
          <Typography.Title level={5}>Tax & Compliance</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
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

          <Divider />
          <Typography.Title level={5}>Financial Terms</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
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

          <Divider />
          <Typography.Title level={5}>Banking</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
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
        </Form>
      </Card>
    </div>
  )
}
