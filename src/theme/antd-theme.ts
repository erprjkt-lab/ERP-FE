import type { ThemeConfig } from 'antd'
import { BRAND_PRIMARY } from '@/theme/brand'
import { NEUTRAL_TOKENS } from '@/theme/neutrals'
import { SIDEBAR_BG, SIDEBAR_SUBMENU_BG } from '@/theme/sidebar'
import { FONT_BODY } from '@/theme/typography'

export const ANTD_THEME: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    borderRadius: 6,
    fontFamily: FONT_BODY,
    ...NEUTRAL_TOKENS,
  },
  components: {
    Menu: {
      darkItemBg: SIDEBAR_BG,
      darkSubMenuItemBg: SIDEBAR_SUBMENU_BG,
      darkItemSelectedBg: BRAND_PRIMARY,
      darkItemSelectedColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
      darkItemColor: 'rgba(255, 255, 255, 0.72)',
    },
  },
}
