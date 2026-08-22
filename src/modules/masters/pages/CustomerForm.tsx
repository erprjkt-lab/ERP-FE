import { App, Button, Card, Col, Form, Row, Select, Space } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
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
  const countryId = Form.useWatch('countryId', form) as string | undefined
  const stateId = Form.useWatch('stateId', form) as string | undefined
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates(countryId)
  const { data: cities = [] } = useCities(stateId)
  const { mutateAsync: createCustomer, isPending: creating } = useCreateCustomer()
  const { mutateAsync: updateCustomer, isPending: updating } = useUpdateCustomer()

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

  const countryOptions = countries.map(c => ({ label: c.name, value: String(c.id) }))
  const stateOptions = states.map(s => ({ label: s.name, value: String(s.id) }))
  const cityOptions = cities.map(c => ({ label: c.name, value: String(c.id) }))

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
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <FormSection title="Basic Info">
            {isEdit && <FormField label="Customer Code" name="code" disabled />}
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Customer Name"
                  name="name"
                  rules={[{ required: true, message: 'Customer name is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Customer Type"
                  name="customerType"
                  fieldType="select"
                  options={CUSTOMER_TYPE_OPTIONS}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Contact Person"
                  name="contactPerson"
                  rules={[{ required: true, message: 'Contact person is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Mobile"
                  name="mobile"
                  rules={[
                    { required: true, message: 'Mobile is required' },
                    { pattern: MOBILE_REGEX, message: 'Enter a valid 10-digit mobile number' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Email"
                  name="email"
                  rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Website" name="website" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Status"
                  name="status"
                  fieldType="select"
                  options={MASTER_STATUS_OPTIONS}
                  initialValue="active"
                />
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Address">
            <FormField
              label="Address"
              name="address"
              fieldType="textarea"
              rules={[{ required: true, message: 'Address is required' }]}
            />
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
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
              </Col>
              <Col xs={24} sm={12} md={8}>
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
              </Col>
              <Col xs={24} sm={12} md={8}>
                <FormField
                  label="City"
                  name="cityId"
                  fieldType="select"
                  options={cityOptions}
                  rules={[{ required: true, message: 'City is required' }]}
                />
              </Col>
            </Row>
            <FormField
              label="Pincode"
              name="pincode"
              rules={[{ pattern: PINCODE_REGEX, message: 'Enter a valid 6-digit pincode' }]}
            />
          </FormSection>

          <FormSection title="Tax & Compliance">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <FormField
                  label="GST Number"
                  name="gstNumber"
                  rules={[{ pattern: GST_REGEX, message: 'Enter a valid GSTIN' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <FormField
                  label="PAN Number"
                  name="panNumber"
                  rules={[{ pattern: PAN_REGEX, message: 'Enter a valid PAN' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <FormField
                  label="GST Type"
                  name="gstType"
                  fieldType="select"
                  options={GST_TYPE_OPTIONS}
                />
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Financial Terms">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Credit Limit" name="creditLimit" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Credit Days" name="creditDays" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Opening Balance" name="openingBalance" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Payment Terms"
                  name="paymentTerms"
                  fieldType="select"
                  options={PAYMENT_TERMS_OPTIONS}
                />
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Banking">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Bank Name" name="bankName" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Branch" name="bankBranch" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Account Holder" name="accountHolder" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Account Number" name="accountNumber" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="IFSC Code"
                  name="ifscCode"
                  rules={[{ pattern: IFSC_REGEX, message: 'Enter a valid IFSC code' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="UPI ID" name="upiId" />
              </Col>
            </Row>
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}
