import type { ThemeConfig } from 'antd'
import { BRAND_PRIMARY, BRAND_PRIMARY_ACTIVE, BRAND_PRIMARY_HOVER } from '@/theme/brand'
import { NEUTRAL_TOKENS } from '@/theme/neutrals'
import { SEMANTIC_TOKENS } from '@/theme/semantic'
import { SIDEBAR_BG, SIDEBAR_SUBMENU_BG } from '@/theme/sidebar'
import { FONT_BODY } from '@/theme/typography'

export const ANTD_THEME: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    colorPrimaryHover: BRAND_PRIMARY_HOVER,
    colorPrimaryActive: BRAND_PRIMARY_ACTIVE,
    borderRadius: 4,
    borderRadiusLG: 8,
    borderRadiusSM: 3,
    borderRadiusXS: 2,
    fontFamily: FONT_BODY,
    fontSize: 14,
    controlHeight: 32,
    boxShadow: '0 1px 2px rgba(27, 29, 34, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(27, 29, 34, 0.10)',
    ...NEUTRAL_TOKENS,
    ...SEMANTIC_TOKENS,
  },
  components: {
    Menu: {
      darkItemBg: SIDEBAR_BG,
      darkSubMenuItemBg: SIDEBAR_SUBMENU_BG,
      darkItemSelectedBg: 'rgba(74, 111, 165, 0.22)',
      darkItemSelectedColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
      darkItemColor: 'rgba(255, 255, 255, 0.72)',
      itemBorderRadius: 6,
      itemHeight: 40,
    },
    Layout: {
      headerBg: '#FFFFFF',
      bodyBg: NEUTRAL_TOKENS.colorBgLayout,
    },
    // Density is tuned for shop-floor use: more of a record visible without scrolling.
    Card: {
      paddingLG: 14,
      headerHeight: 44,
      headerFontSize: 15,
    },
    Form: {
      itemMarginBottom: 12,
      verticalLabelPadding: '0 0 2px',
    },
    Table: {
      headerBg: NEUTRAL_TOKENS.colorBgContainer,
      headerColor: NEUTRAL_TOKENS.colorTextSecondary,
      rowHoverBg: '#F7F6F2',
      cellPaddingBlock: 8,
      cellPaddingBlockSM: 6,
    },
    Descriptions: {
      itemPaddingBottom: 8,
    },
    Button: {
      controlHeight: 32,
      fontWeight: 500,
    },
    Input: {
      controlHeight: 32,
    },
    Select: {
      controlHeight: 32,
    },
    DatePicker: {
      controlHeight: 32,
    },
  },
}
