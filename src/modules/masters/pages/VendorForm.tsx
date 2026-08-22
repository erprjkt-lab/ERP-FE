import { App, Button, Card, Col, Form, Row, Select, Space } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
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
  const countryId = Form.useWatch('countryId', form) as string | undefined
  const stateId = Form.useWatch('stateId', form) as string | undefined
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates(countryId)
  const { data: cities = [] } = useCities(stateId)
  const { mutateAsync: createVendor, isPending: creating } = useCreateVendor()
  const { mutateAsync: updateVendor, isPending: updating } = useUpdateVendor()

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

  const countryOptions = countries.map(c => ({ label: c.name, value: String(c.id) }))
  const stateOptions = states.map(s => ({ label: s.name, value: String(s.id) }))
  const cityOptions = cities.map(c => ({ label: c.name, value: String(c.id) }))

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
      countryName: countryOptions.find(o => o.value === values.countryId)?.label,
      stateId: (values.stateId as string | undefined) ?? null,
      stateName: stateOptions.find(o => o.value === values.stateId)?.label,
      cityId: (values.cityId as string | undefined) ?? null,
      cityName: cityOptions.find(o => o.value === values.cityId)?.label,
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
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <FormSection title="Basic Info">
            {isEdit && <FormField label="Vendor Code" name="code" disabled />}
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Vendor Name"
                  name="name"
                  rules={[{ required: true, message: 'Vendor name is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Vendor Type"
                  name="vendorType"
                  fieldType="select"
                  options={VENDOR_TYPE_OPTIONS}
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
                <FormField label="Service Category" name="serviceCategory" />
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

          <FormSection title="Tax">
            <FormField
              label="GST Number"
              name="gstNumber"
              rules={[{ pattern: GST_REGEX, message: 'Enter a valid GSTIN' }]}
            />
          </FormSection>

          <FormSection title="Banking">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Bank Name" name="bankName" />
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
            </Row>
          </FormSection>

          <FormSection title="Notes">
            <FormField label="Remarks" name="remarks" fieldType="textarea" />
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}
