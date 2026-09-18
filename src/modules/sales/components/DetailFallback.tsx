import { ArrowLeftOutlined } from '@ant-design/icons'
import { Alert, Button, Spin } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'

interface DetailFallbackProps {
  isLoading: boolean
  error: unknown
  backTo: string
  backLabel: string
  notFoundLabel: string
}

/** Shown while a sales document detail page has nothing to render. A failed
 * request used to fall through to "not found", which hid the real reason
 * (a 401, a server error) behind a misleading message. */
export const DetailFallback: FC<DetailFallbackProps> = ({
  isLoading,
  error,
  backTo,
  backLabel,
  notFoundLabel,
}) => {
  const navigate = useNavigate()

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backTo)}>
        {backLabel}
      </Button>
      <div style={{ marginTop: 24 }}>
        {isLoading ? (
          <Spin />
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="Could not load this document"
            description={error instanceof Error ? error.message : 'The request failed.'}
          />
        ) : (
          <Alert type="warning" showIcon message={notFoundLabel} />
        )}
      </div>
    </div>
  )
}
