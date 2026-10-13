import { UploadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Form, Upload } from 'antd'
import type { UploadFile } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { useCreateComplaintResolution } from '../hooks/useCustomerComplaints'

export interface ComplaintResolutionDrawerProps {
  open: boolean
  complaintId: string
  complaintNumber: string
  onClose: () => void
}

const fileFromEvent = (event: unknown) =>
  Array.isArray(event) ? event : ((event as { fileList?: UploadFile[] })?.fileList ?? [])

export const ComplaintResolutionDrawer: FC<ComplaintResolutionDrawerProps> = ({
  open,
  complaintId,
  complaintNumber,
  onClose,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { mutateAsync: createResolution, isPending } = useCreateComplaintResolution()

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleSubmit = async () => {
    let values: Record<string, unknown>
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    try {
      await createResolution({
        id: complaintId,
        payload: {
          report_number: values.reportNumber as string,
          action_taken: values.actionTaken as string,
          customer_feedback_reference: (values.customerFeedbackReference as string) ?? null,
          remark: (values.remark as string) ?? null,
          report_document:
            (values.reportDocument as UploadFile[] | undefined)?.[0]?.originFileObj ?? null,
        },
      })
      message.success('Resolution recorded')
      onClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={`Record Resolution — ${complaintNumber}`}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      width={560}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Recording a resolution moves this complaint to Resolved, which is the only state it can be closed from."
      />
      <Form form={form} layout="vertical">
        <FormField
          label="Report Number"
          name="reportNumber"
          rules={[
            { required: true, message: 'Report number is required' },
            { max: 30, message: 'Report number cannot exceed 30 characters' },
          ]}
        />
        <FormField
          label="Action Taken"
          name="actionTaken"
          fieldType="textarea"
          rules={[{ required: true, message: 'Action taken is required' }]}
        />
        <FormField
          label="Customer Feedback Reference"
          name="customerFeedbackReference"
          rules={[{ max: 150, message: 'Cannot exceed 150 characters' }]}
        />
        <FormField label="Remark" name="remark" fieldType="textarea" />
        <Form.Item
          label="Report Document"
          name="reportDocument"
          valuePropName="fileList"
          getValueFromEvent={fileFromEvent}
          extra="PDF or Word document, up to 10 MB."
        >
          <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.doc,.docx">
            <Button icon={<UploadOutlined />}>Select document</Button>
          </Upload>
        </Form.Item>
      </Form>
    </FormDrawer>
  )
}
