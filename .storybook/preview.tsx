import type { Preview } from '@storybook/react'
import { ConfigProvider } from 'antd'
import React from 'react'
import { ANTD_THEME } from '@/theme/antd-theme'
import { NEUTRAL_TOKENS } from '@/theme/neutrals'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    Story => (
      <ConfigProvider theme={ANTD_THEME}>
        <div style={{ padding: 24, background: NEUTRAL_TOKENS.colorBgLayout, minHeight: '100vh' }}>
          <Story />
        </div>
      </ConfigProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'padded',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#141414' },
      ],
    },
  },
}

export default preview
