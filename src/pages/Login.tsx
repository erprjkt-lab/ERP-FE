import {
  ApartmentOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { App, Button, Checkbox, Form, Input, Modal } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { useLogin } from '@/hooks/useAuth'
import type { LoginPayload } from '@/types/api/auth'
import brandLogo from '@/assets/brand/01.png'
import brandMark from '@/assets/brand/02.png'
import './Login.css'

export const Login: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { mutate: submitLogin, isPending } = useLogin()
  const [rememberMe, setRememberMe] = useState(true)

  const handleFinish = (values: LoginPayload) => {
    submitLogin(values, {
      onSuccess: () => {
        message.success('Authenticated successfully. Welcome back to CoreFlow!')
        navigate('/', { replace: true })
      },
      onError: error => {
        message.error(getErrorMessage(error, 'Login failed. Please verify credentials.'))
      },
    })
  }

  const handleForgotPassword = () => {
    Modal.info({
      title: 'Credential Assistance',
      centered: true,
      icon: <InfoCircleOutlined style={{ color: '#00A0E3' }} />,
      content: (
        <div style={{ marginTop: 12, lineHeight: 1.6, color: '#475569' }}>
          <p>
            Employee accounts and permission tokens are managed by your organization&apos;s
            designated <strong>CoreFlow System Administrator</strong>.
          </p>
          <div
            style={{
              background: '#F1F5F9',
              padding: '10px 14px',
              borderRadius: 8,
              marginTop: 10,
              fontSize: 13,
            }}
          >
            <strong>IT Support:</strong>{' '}
            <span style={{ color: '#00A0E3', fontWeight: 600 }}>support@coreflowtech.com</span>
          </div>
        </div>
      ),
      okText: 'Close',
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg, #00A0E3 0%, #0289C3 100%)',
          borderColor: 'transparent',
          borderRadius: 8,
        },
      },
    })
  }

  return (
    <div className="cf-login-page">
      {/* Radiant Background Aura and Fine Precision Grid */}
      <div className="cf-ambient-mesh">
        <div className="cf-glow-orb cf-orb-1" />
        <div className="cf-glow-orb cf-orb-2" />
      </div>
      <div className="cf-blueprint-grid" />

      {/* Unified Dual-Part Card (Fitted strictly inside 100vh with Zero Scrolling) */}
      <main className="cf-unified-card">
        {/* ==================================================================
            PART 1: LEFT BRAND & ENTERPRISE HIGHLIGHTS DECK
            ================================================================== */}
        <section className="cf-part-brand" aria-label="CoreFlow Enterprise Info">
          <div className="cf-brand-top">
            <div className="cf-brand-header-row">
              <img src={brandLogo} alt="CoreFlow Tech" className="cf-left-logo-img" />
              <div className="cf-status-pill">
                <span className="cf-pulse-green" />
                <span>Cloud v4.2 Active</span>
              </div>
            </div>

            <h1 className="cf-brand-headline">
              Autonomous Operations for{' '}
              <span className="cf-headline-accent">Modern Manufacturing</span>
            </h1>
            <p className="cf-brand-description">
              Unified digital control for production work centers, real-time stock velocity, and
              first-article quality compliance.
            </p>
          </div>

          {/* Compact Enterprise Pillars (Zero Clutter) */}
          <div className="cf-brand-features">
            <div className="cf-feature-item">
              <div className="cf-feature-icon-box">
                <ApartmentOutlined />
              </div>
              <div className="cf-feature-text">
                <span className="cf-feature-title">Shopfloor Execution</span>
                <span className="cf-feature-sub">
                  Live job cards, routing &amp; machine telemetry
                </span>
              </div>
            </div>

            <div className="cf-feature-item">
              <div className="cf-feature-icon-box">
                <SyncOutlined />
              </div>
              <div className="cf-feature-text">
                <span className="cf-feature-title">Continuous Inventory Flow</span>
                <span className="cf-feature-sub">Automated procurement, GRN &amp; stock sync</span>
              </div>
            </div>

            <div className="cf-feature-item">
              <div className="cf-feature-icon-box">
                <SafetyCertificateOutlined />
              </div>
              <div className="cf-feature-text">
                <span className="cf-feature-title">Zero-Defect Quality</span>
                <span className="cf-feature-sub">FIR, IIR &amp; Poka-Yoke inspection audits</span>
              </div>
            </div>
          </div>

          <div className="cf-brand-footer">
            <span className="cf-trust-tag">🔒 256-bit AES</span>
            <span className="cf-trust-tag">🛡️ ISO 27001 Certified</span>
            <span className="cf-trust-tag">⚡ 99.98% Uptime</span>
          </div>
        </section>

        {/* ==================================================================
            PART 2: RIGHT FOCUSED SINGLE-LOGIN CONSOLE (NO TABS)
            ================================================================== */}
        <section className="cf-part-auth" aria-label="Sign In Deck">
          <div className="cf-auth-top-glow" />

          {/* Mobile Brand Row (only on narrow viewports) */}
          <div className="cf-mobile-brand-row">
            <img src={brandLogo} alt="CoreFlow Tech" style={{ height: 36 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00A0E3' }}>ENTERPRISE ERP</span>
          </div>

          {/* Right Header with Brand Mark */}
          <header className="cf-auth-header">
            <div>
              <h2 className="cf-auth-title">Sign In</h2>
              <p className="cf-auth-subtitle">Enter your corporate credentials to continue</p>
            </div>

            <div className="cf-auth-mark-box">
              <img src={brandMark} alt="CoreFlow Mark" className="cf-auth-mark-img" />
            </div>
          </header>

          {/* Single Direct Login Form */}
          <Form
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            className="cf-auth-form"
            initialValues={{ email: '', password: '' }}
          >
            <label className="cf-field-label" htmlFor="cf_unified_email">
              Work Email
            </label>
            <Form.Item
              name="email"
              className="cf-form-item"
              rules={[
                { required: true, message: 'Please enter your corporate email' },
                { type: 'email', message: 'Please enter a valid work email address' },
              ]}
            >
              <Input
                id="cf_unified_email"
                prefix={<UserOutlined className="cf-input-icon" />}
                placeholder="you@company.com"
                className="cf-custom-input"
                size="large"
                autoComplete="email"
              />
            </Form.Item>

            <label className="cf-field-label" htmlFor="cf_unified_password">
              Password
            </label>
            <Form.Item
              name="password"
              className="cf-form-item"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                id="cf_unified_password"
                prefix={<LockOutlined className="cf-input-icon" />}
                placeholder="Enter security password"
                className="cf-custom-input"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="cf-options-row">
              <Checkbox
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="cf-remember-check"
              >
                Remember me
              </Checkbox>

              <button type="button" onClick={handleForgotPassword} className="cf-forgot-btn">
                Forgot password?
              </button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isPending}
              className="cf-submit-btn"
            >
              <span>Sign In to Workspace</span>
              <ArrowRightOutlined className="cf-btn-arrow" />
            </Button>
          </Form>

          {/* Card Bottom Footer */}
          <footer className="cf-auth-footer">
            <span>Zero-Trust Enterprise Protocol</span>
            <span>&copy; {new Date().getFullYear()} CoreFlow Tech</span>
          </footer>
        </section>
      </main>
    </div>
  )
}
