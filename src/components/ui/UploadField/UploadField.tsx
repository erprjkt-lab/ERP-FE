import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import type { FC } from 'react'

export interface UploadFieldProps {
  value?: string
  onChange?: (value: string | undefined) => void
  /** 'image' keeps a base64 preview (small, safe to persist); 'file' keeps only the filename. */
  mode?: 'image' | 'file'
  accept?: string
  disabled?: boolean
}

export const UploadField: FC<UploadFieldProps> = ({
  value,
  onChange,
  mode = 'file',
  accept,
  disabled,
}) => {
  const handleChange: UploadProps['onChange'] = ({ file }) => {
    if (file.status === 'removed') {
      onChange?.(undefined)
      return
    }
    const raw = (file.originFileObj ?? file) as File
    if (mode === 'image') {
      const reader = new FileReader()
      reader.onload = () => onChange?.(reader.result as string)
      reader.readAsDataURL(raw)
    } else {
      // Never read the file contents into state — a large PDF/DWG as base64
      // could blow past localStorage's persisted-store quota. Filename only.
      onChange?.(raw.name)
    }
  }

  const fileList: UploadFile[] = value
    ? [
        {
          uid: '-1',
          name: mode === 'image' ? 'image' : value,
          status: 'done',
          url: mode === 'image' ? value : undefined,
        },
      ]
    : []

  if (mode === 'image') {
    return (
      <Upload
        listType="picture-card"
        accept={accept}
        maxCount={1}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleChange}
        disabled={disabled}
      >
        {fileList.length === 0 && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
    )
  }

  return (
    <Upload
      accept={accept}
      maxCount={1}
      fileList={fileList}
      beforeUpload={() => false}
      onChange={handleChange}
      disabled={disabled}
    >
      <Button icon={<UploadOutlined />} disabled={disabled}>
        {value ? 'Replace file' : 'Select file'}
      </Button>
    </Upload>
  )
}
