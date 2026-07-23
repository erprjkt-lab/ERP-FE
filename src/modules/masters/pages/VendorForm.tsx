import { App, Button, Card, Divider, Form, Select, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import type { VendorType } from '@/types/masters'
import {
  GST_REGEX,
  IFSC_REGEX,
  MASTER_STATUS_OPTIONS,
  MOBILE_REGEX,
  PINCODE_REGEX,
  VENDOR_TYPE_OPTIONS,
} from '../constants'
import { useCities } from '../hooks/useCities'
import { useCountries } from '../hooks/useCountries'
import { useStates } from '../hooks/useStates'
import { useCreateVendor, useUpdateVendor, useVendor } from '../hooks/useVendors'
import type { VendorInput } from '../store/mastersStore'

export const VendorForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: vendor } = useVendor(id)
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates()
  const { data: cities = [] } = useCities()
  const { mutateAsync: createVendor, isPending: creating } = useCreateVendor()
  const { mutateAsync: updateVendor, isPending: updating } = useUpdateVendor()

  const countryId = Form.useWatch('countryId', form)
  const stateId = Form.useWatch('stateId', form)

  useEffect(() => {
    if (isEdit && vendor) {
      form.setFieldsValue({
        code: vendor.code,
        name: vendor.name,
        vendorType: vendor.vendorType,
        status: vendor.status,
        contactPerson: vendor.contactPerson,
        mobile: vendor.mobile,
        email: vendor.email,
        serviceCategory: vendor.serviceCategory,
        address: vendor.address,
        countryId: vendor.countryId ?? undefined,
        stateId: vendor.stateId ?? undefined,
        cityId: vendor.cityId ?? undefined,
        pincode: vendor.pincode,
        gstNumber: vendor.gstNumber,
        bankName: vendor.bankName,
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
        remarks: vendor.remarks,
      })
    }
    // vendor is a freshly-composed object on every render (useVendors maps
    // over the store array each call), so depending on it directly would
    // re-run this effect — and stomp in-progress edits — on every keystroke.
    // Depend on the stable id instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, vendor?.id, form])

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
      vendorType: (values.vendorType as VendorType | undefined) ?? null,
      status: values.status as 'active' | 'inactive',
      contactPerson: values.contactPerson as string,
      mobile: values.mobile as string,
      email: values.email as string,
      serviceCategory: values.serviceCategory as string | undefined,
      address: values.address as string,
      countryId: (values.countryId as string | undefined) ?? null,
      stateId: (values.stateId as string | undefined) ?? null,
      cityId: (values.cityId as string | undefined) ?? null,
      pincode: values.pincode as string,
      gstNumber: values.gstNumber as string | undefined,
      bankName: values.bankName as string | undefined,
      accountNumber: values.accountNumber as string | undefined,
      ifscCode: values.ifscCode as string | undefined,
      remarks: values.remarks as string | undefined,
    } satisfies VendorInput

    try {
      if (isEdit && vendor) {
        await updateVendor({ id: vendor.id, payload })
      } else {
        await createVendor(payload)
      }
      message.success(`Vendor ${isEdit ? 'updated' : 'created'} successfully`)
      navigate('/masters/vendors')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Vendor' : 'Add Vendor'}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Vendors', href: '/masters/vendors' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/masters/vendors')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Vendor
            </Button>
          </Space>
        }
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ maxWidth: 900 }}>
          <Typography.Title level={5}>Basic Info</Typography.Title>
          {isEdit && <FormField label="Vendor Code" name="code" disabled />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Vendor Name"
              name="name"
              rules={[{ required: true, message: 'Vendor name is required' }]}
            />
            <FormField
              label="Vendor Type"
              name="vendorType"
              fieldType="select"
              options={VENDOR_TYPE_OPTIONS}
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
            <FormField label="Service Category" name="serviceCategory" />
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
          <Typography.Title level={5}>Tax</Typography.Title>
          <FormField
            label="GST Number"
            name="gstNumber"
            rules={[{ pattern: GST_REGEX, message: 'Enter a valid GSTIN' }]}
          />

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
