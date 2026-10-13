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
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    fontFamily: FONT_BODY,
    fontSize: 14,
    controlHeight: 32,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(15, 23, 42, 0.08)',
    ...NEUTRAL_TOKENS,
    ...SEMANTIC_TOKENS,
  },
  components: {
    Menu: {
      darkItemBg: SIDEBAR_BG,
      darkSubMenuItemBg: SIDEBAR_SUBMENU_BG,
      darkItemSelectedBg: 'rgba(0, 160, 227, 0.16)',
      darkItemSelectedColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(0, 160, 227, 0.08)',
      darkItemColor: 'rgba(255, 255, 255, 0.72)',
      itemBorderRadius: 6,
      itemHeight: 40,
    },
    Layout: {
      headerBg: '#FFFFFF',
      bodyBg: NEUTRAL_TOKENS.colorBgLayout,
      siderBg: SIDEBAR_BG,
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
      headerBg: '#F8FAFC',
      headerColor: '#475569',
      rowHoverBg: '#F0F9FF',
      cellPaddingBlock: 8,
      cellPaddingBlockSM: 6,
    },
    Descriptions: {
      itemPaddingBottom: 8,
    },
    Button: {
      controlHeight: 32,
      fontWeight: 500,
      primaryShadow: '0 2px 8px rgba(2, 137, 195, 0.28)',
    },
    Tabs: {
      itemSelectedColor: BRAND_PRIMARY,
      itemHoverColor: BRAND_PRIMARY_HOVER,
      inkBarColor: BRAND_PRIMARY,
    },
    Tag: {
      borderRadiusSM: 4,
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
