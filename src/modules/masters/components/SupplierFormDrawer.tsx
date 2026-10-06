import { App, Form, Select } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import {
  DEFAULT_COUNTRY_NAME,
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
import { getErrorMessage } from '@/api/client'

const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }

export interface SupplierFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to add a new supplier; pass an id to edit that supplier. */
  supplierId?: string
}

export const SupplierFormDrawer: FC<SupplierFormDrawerProps> = ({ open, onClose, supplierId }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!supplierId

  const { data: supplier } = useSupplier(supplierId)
  const countryId = Form.useWatch('countryId', form) as string | undefined
  const stateId = Form.useWatch('stateId', form) as string | undefined
  const { data: countries = [] } = useCountries()
  const { data: states = [] } = useStates(countryId)
  const { data: cities = [] } = useCities(stateId)
  const { mutateAsync: createSupplier, isPending: creating } = useCreateSupplier()
  const { mutateAsync: updateSupplier, isPending: updating } = useUpdateSupplier()

  const countryOptions = countries.map(c => ({ label: c.name, value: String(c.id) }))
  const stateOptions = states.map(s => ({ label: s.name, value: String(s.id) }))
  const cityOptions = cities.map(c => ({ label: c.name, value: String(c.id) }))

  useEffect(() => {
    if (!open) return
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
    } else if (!isEdit) {
      form.resetFields()
    }
    // supplier is a freshly-composed object on every render (useSuppliers
    // maps over the store array each call), so depending on it directly
    // would re-run this effect on every keystroke. Depend on the stable id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, supplier?.id, form])

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
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
      status={isEdit ? (supplier?.status ?? 'active') : undefined}
      open={open}
      width={720}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Update Supplier' : 'Save Supplier'}
    >
      <Form form={form} layout="vertical">
        <FormSection title="Basic Info">
          {isEdit && <FormField label="Supplier Code" name="code" disabled />}
          <div style={gridStyle}>
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

        <FormSection title="Tax & Terms">
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
              label="Payment Terms"
              name="paymentTerms"
              fieldType="select"
              options={PAYMENT_TERMS_OPTIONS}
            />
            <FormField label="Credit Days" name="creditDays" fieldType="number" />
          </div>
        </FormSection>

        <FormSection title="Banking">
          <div style={gridStyle}>
            <FormField label="Bank Name" name="bankName" />
            <FormField label="Account Number" name="accountNumber" />
            <FormField
              label="IFSC Code"
              name="ifscCode"
              rules={[{ pattern: IFSC_REGEX, message: 'Enter a valid IFSC code' }]}
            />
          </div>
        </FormSection>

        <FormSection title="Notes">
          <FormField label="Remarks" name="remarks" fieldType="textarea" />
        </FormSection>
      </Form>
    </FormDrawer>
  )
}
