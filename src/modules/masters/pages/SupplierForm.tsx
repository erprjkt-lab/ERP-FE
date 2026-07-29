import { App, Button, Card, Divider, Form, Select, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  GST_REGEX,
  IFSC_REGEX,
  MASTER_STATUS_OPTIONS,
  MOBILE_REGEX,
  PAN_REGEX,
  PAYMENT_TERMS_OPTIONS,
  PINCODE_REGEX,
} from '../constants'
import { useCities } from '../hooks/useCities'
import { useCountries } from '../hooks/useCountries'
import { useCreateSupplier, useSupplier, useUpdateSupplier } from '../hooks/useSuppliers'
import { useStates } from '../hooks/useStates'
import type { SupplierInput } from '../store/mastersStore'

export const SupplierForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: supplier } = useSupplier(id)
  const countryId = Form.useWatch('countryId', form) as string | undefined
  const stateId = Form.useWatch('stateId', form) as string | undefined
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates(countryId)
  const { data: cities = [] } = useCities(stateId)
  const { mutateAsync: createSupplier, isPending: creating } = useCreateSupplier()
  const { mutateAsync: updateSupplier, isPending: updating } = useUpdateSupplier()

  useEffect(() => {
    if (isEdit && supplier) {
      form.setFieldsValue({
        code: supplier.code,
        name: supplier.name,
        status: supplier.status,
        contactPerson: supplier.contactPerson,
        mobile: supplier.mobile,
        email: supplier.email,
        address: supplier.address,
        countryId: supplier.countryId ?? undefined,
        stateId: supplier.stateId ?? undefined,
        cityId: supplier.cityId ?? undefined,
        pincode: supplier.pincode,
        gstNumber: supplier.gstNumber,
        panNumber: supplier.panNumber,
        paymentTerms: supplier.paymentTerms,
        creditDays: supplier.creditDays,
        bankName: supplier.bankName,
        accountNumber: supplier.accountNumber,
        ifscCode: supplier.ifscCode,
        remarks: supplier.remarks,
      })
    }
    // supplier is a freshly-composed object on every render (useSuppliers
    // maps over the store array each call), so depending on it directly
    // would re-run this effect — and stomp in-progress edits — on every
    // keystroke. Depend on the stable id instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, supplier?.id, form])

  const countryOptions = countries.map(c => ({ label: c.name, value: String(c.id) }))
  const stateOptions = states.map(s => ({ label: s.name, value: String(s.id) }))
  const cityOptions = cities.map(c => ({ label: c.name, value: String(c.id) }))

  const handleFinish = async (values: Record<string, unknown>) => {
    const payload = {
      name: values.name as string,
      status: values.status as 'active' | 'inactive',
      contactPerson: values.contactPerson as string,
      mobile: values.mobile as string,
      email: values.email as string,
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
      paymentTerms: (values.paymentTerms as string | undefined) ?? null,
      creditDays: (values.creditDays as number | undefined) ?? 0,
      bankName: values.bankName as string | undefined,
      accountNumber: values.accountNumber as string | undefined,
      ifscCode: values.ifscCode as string | undefined,
      remarks: values.remarks as string | undefined,
    } satisfies SupplierInput

    try {
      if (isEdit && supplier) {
        await updateSupplier({ id: supplier.id, payload })
      } else {
        await createSupplier(payload)
      }
      message.success(`Supplier ${isEdit ? 'updated' : 'created'} successfully`)
      navigate('/masters/suppliers')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Suppliers', href: '/masters/suppliers' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/masters/suppliers')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Supplier
            </Button>
          </Space>
        }
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ maxWidth: 900 }}>
          <Typography.Title level={5}>Basic Info</Typography.Title>
          {isEdit && <FormField label="Supplier Code" name="code" disabled />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Supplier Name"
              name="name"
              rules={[{ required: true, message: 'Supplier name is required' }]}
            />
            <FormField
              label="Status"
              name="status"
              fieldType="select"
              options={MASTER_STATUS_OPTIONS}
              initialValue="active"
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
          <Typography.Title level={5}>Tax & Terms</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
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
              label="Payment Terms"
              name="paymentTerms"
              fieldType="select"
              options={PAYMENT_TERMS_OPTIONS}
            />
            <FormField label="Credit Days" name="creditDays" fieldType="number" />
          </div>

          <Divider />
          <Typography.Title level={5}>Banking</Typography.Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField label="Bank Name" name="bankName" />
            <FormField label="Account Number" name="accountNumber" />
            <FormField
              label="IFSC Code"
              name="ifscCode"
              rules={[{ pattern: IFSC_REGEX, message: 'Enter a valid IFSC code' }]}
            />
          </div>

          <Divider />
          <Typography.Title level={5}>Notes</Typography.Title>
          <FormField label="Remarks" name="remarks" fieldType="textarea" />
        </Form>
      </Card>
    </div>
  )
}
