import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import type { LoginPayload } from '@/types/api/auth'

export const Login: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { mutate: submitLogin, isPending } = useLogin()

  const handleFinish = (values: LoginPayload) => {
    submitLogin(values, {
      onSuccess: () => {
        message.success('Signed in successfully')
        navigate('/', { replace: true })
      },
      onError: error => {
        message.error(error instanceof Error ? error.message : 'Login failed')
      },
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Sign in
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Employee portal
        </Typography.Text>

        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={isPending}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  )
}
