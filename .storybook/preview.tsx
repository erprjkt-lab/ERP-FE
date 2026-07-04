import type { Preview } from '@storybook/react'
import { ConfigProvider } from 'antd'
import React from 'react'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    Story => (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
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
