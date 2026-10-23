import { DownOutlined, EllipsisOutlined, RightOutlined, UpOutlined } from '@ant-design/icons'
import { Checkbox, Dropdown, Empty, Pagination, Radio, Skeleton, Table } from 'antd'
import type { TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { FC, ReactNode } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { TableActionBar } from '../TableActionBar'
import type { TableActionItem } from '../TableActionBar'
import './DataTable.css'

/** Desktop renders an antd `Table`; below 768px the same columns are rendered as
 * a card list instead (see `useIsMobile`). Only one of the two is ever mounted,
 * so inherited props that antd implements *inside* the table — `summary`,
 * `footer`, `title`, `rowClassName`, `components` — have no effect on mobile.
 * Anything that must survive both views belongs in a column or `mobileCardRender`. */
export interface DataTableProps<T extends AnyObject> extends TableProps<T> {
  totalLabel?: string
  /** Fills the parent container's height and scrolls only the table body on desktop */
  fillHeight?: boolean
  /** Custom row hover action items on desktop; on mobile shown via 3-dots action dropdown */
  rowActions?: (record: T) => (TableActionItem | null | undefined | false)[]
  /** Custom popover render function for the hovered row */
  renderRowActions?: (record: T) => ReactNode
  /** Custom mobile card render function if a page requires a 100% custom mobile card */
  mobileCardRender?: (record: T, index: number, defaultCard: ReactNode) => ReactNode
  /** Option to disable mobile card conversion and keep standard desktop table on mobile */
  disableMobileCards?: boolean
}

// ---------------------------------------------------------------------------
// Avatar / Initials generator with vibrant gradient palettes
// ---------------------------------------------------------------------------
const AVATAR_PALETTES = [
  { bg: 'linear-gradient(135deg, #00A0E3 0%, #0289C3 100%)', color: '#ffffff' }, // CoreFlow Cyan
  { bg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: '#ffffff' }, // Purple
  { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#ffffff' }, // Emerald
  { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#ffffff' }, // Amber
  { bg: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', color: '#ffffff' }, // Rose/Pink
  { bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#ffffff' }, // Blue
  { bg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', color: '#ffffff' }, // Teal
  { bg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#ffffff' }, // Indigo
]

function getAvatarStyle(seed: string) {
  let hash = 0
  const str = String(seed || '')
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[index]
}

function getInitials(text: unknown): string {
  if (typeof text !== 'string' && typeof text !== 'number') return '•'
  const str = String(text).trim()
  const cleaned = str.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  if (!cleaned) return str.slice(0, 2).toUpperCase()
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Card Information Extractor
// Intelligently maps any Table record + columns into a structured, labeled card
// ---------------------------------------------------------------------------
interface CardFieldItem {
  label: string
  value: ReactNode
  span: 1 | 2 | 3
}

interface ExtractedCardInfo {
  title: string
  code?: string
  statusNode?: ReactNode
  avatarSeed: string
  fields: CardFieldItem[]
  /** Rendered content of any column keyed/titled "action(s)", shown as its own
   * row on the card so column-rendered buttons stay reachable on a phone. */
  actionNodes: ReactNode[]
}

type CellPath = string | number | readonly (string | number)[]

/** The subset of an antd column this extractor actually reads. Narrower than
 * `ColumnType<T>` on purpose: `ColumnsType<T>` is a union with column groups,
 * which have no `dataIndex` and would need narrowing at every access. */
interface CardColumn<T> {
  key?: React.Key
  dataIndex?: CellPath
  title?: ReactNode
  hidden?: boolean
  render?: (value: unknown, record: T, index: number) => ReactNode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Reads a column's value off a record, walking an array `dataIndex` path. */
function readCell(
  rec: Record<string, unknown>,
  col: { dataIndex?: CellPath; key?: React.Key },
): unknown {
  const path = col.dataIndex ?? col.key
  if (path === undefined) return undefined
  const keys = Array.isArray(path) ? path : [path as string | number]
  return keys.reduce<unknown>((acc, k) => (isRecord(acc) ? acc[String(k)] : undefined), rec)
}

function extractCardInfo<T extends AnyObject>(
  record: T,
  columns: readonly CardColumn<T>[] | undefined,
  index: number,
): ExtractedCardInfo {
  const rec = record as Record<string, unknown>

  if (!columns || columns.length === 0) {
    const fallbackTitle = String(
      rec.name ?? rec.fullName ?? rec.itemName ?? rec.title ?? rec.code ?? `Item #${index + 1}`,
    )
    return {
      title: fallbackTitle,
      avatarSeed: fallbackTitle,
      fields: [],
      actionNodes: [],
    }
  }

  // Action columns are pulled out rather than dropped. They used to be filtered
  // away entirely, which on a page that renders its buttons in a column instead
  // of via `rowActions` left those actions with nowhere to live on mobile — QC
  // approve/reject, job-card accept/move and a dozen others became unreachable.
  // They get their own row under the card body instead.
  const isActionCol = (col: CardColumn<T>) =>
    ['actions', 'action'].includes(String(col.key || col.dataIndex || '').toLowerCase()) ||
    ['actions', 'action'].includes(
      String(typeof col.title === 'string' ? col.title : '').toLowerCase(),
    )

  const isSelectionCol = (col: CardColumn<T>) =>
    ['select', 'checkbox'].includes(String(col.key || col.dataIndex || '').toLowerCase())

  const actionCols = columns.filter(col => col && !col.hidden && isActionCol(col))

  const validCols = columns.filter(
    col => col && !col.hidden && !isActionCol(col) && !isSelectionCol(col),
  )

  // 1. Resolve Primary Title (e.g. Customer Name, Part Name, PO #)
  const nameCol = validCols.find(c => {
    const k = String(c.dataIndex || c.key || c.title || '').toLowerCase()
    return [
      'name',
      'fullname',
      'itemname',
      'customername',
      'suppliername',
      'vendorname',
      'title',
    ].includes(k)
  })

  const docNoCol = validCols.find(c => {
    const k = String(c.dataIndex || c.key || c.title || '').toLowerCase()
    return [
      'ponumber',
      'ordernumber',
      'challannumber',
      'invoicenumber',
      'jobcardnumber',
      'grnnumber',
      'enquirynumber',
    ].includes(k)
  })

  const codeCol = validCols.find(c => {
    const k = String(c.dataIndex || c.key || c.title || '').toLowerCase()
    return ['code', 'itemcode', 'customercode', 'suppliercode', 'vendorcode'].includes(k)
  })

  // Determine Title string
  let title = ''
  if (nameCol && readCell(rec, nameCol)) {
    title = String(readCell(rec, nameCol))
  } else if (rec.name || rec.fullName || rec.itemName) {
    title = String(rec.name ?? rec.fullName ?? rec.itemName)
  } else if (docNoCol && readCell(rec, docNoCol)) {
    title = String(readCell(rec, docNoCol))
  } else if (codeCol && readCell(rec, codeCol)) {
    title = String(readCell(rec, codeCol))
  } else if (validCols.length > 0) {
    title = String(readCell(rec, validCols[0]) ?? `Item #${index + 1}`)
  } else {
    title = `Item #${index + 1}`
  }

  // 2. Resolve Code Pill (shown under or alongside title)
  let code: string | undefined = undefined
  if (codeCol && readCell(rec, codeCol)) {
    const codeVal = String(readCell(rec, codeCol))
    if (codeVal !== title) {
      code = codeVal
    }
  } else if (rec.code && String(rec.code) !== title) {
    code = String(rec.code)
  }

  // 3. Resolve Status Badge (displayed in card header right)
  const statusCol = validCols.find(c => {
    const k = String(c.dataIndex || c.key || c.title || '').toLowerCase()
    return ['status', 'state', 'stage', 'active', 'is_active', 'complaintstatus'].includes(k)
  })

  let statusNode: ReactNode = undefined
  if (statusCol) {
    const val = readCell(rec, statusCol)
    statusNode = statusCol.render ? statusCol.render(val, record, index) : (val as ReactNode)
  }

  // 4. Extract all other columns into labeled field items
  const fields: CardFieldItem[] = []

  validCols.forEach(col => {
    // Skip if already used in header (as title, code, or status)
    if (col === nameCol && title === String(readCell(rec, col))) return
    if (col === codeCol && code === String(readCell(rec, col))) return
    if (col === statusCol) return

    // Derive readable field label from column title
    let label = ''
    if (typeof col.title === 'string') {
      label = col.title
    } else if (col.dataIndex) {
      label = Array.isArray(col.dataIndex) ? col.dataIndex.join(' ') : String(col.dataIndex)
    } else if (col.key) {
      label = String(col.key)
    }

    // Capitalize first letters or format label
    label = label
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim()

    // Extract rendered or raw value
    const rawVal = readCell(rec, col)
    const rendered = col.render ? col.render(rawVal, record, index) : (rawVal as ReactNode)

    // If value is null, undefined, or empty string, show clean dash
    const isValEmpty =
      rendered === null ||
      rendered === undefined ||
      rendered === '' ||
      (typeof rendered === 'number' && isNaN(rendered))

    const displayValue: ReactNode = isValEmpty ? (
      <span style={{ color: '#cbd5e1' }}>—</span>
    ) : (
      rendered
    )

    // Check if field needs multi-column span in the 3-part layout
    const lowerLabel = label.toLowerCase()
    const isVeryLong =
      lowerLabel.includes('description') ||
      lowerLabel.includes('remark') ||
      lowerLabel.includes('address') ||
      (typeof rawVal === 'string' && rawVal.length > 30)

    const isMidLong =
      lowerLabel.includes('contact') ||
      lowerLabel.includes('email') ||
      (typeof rawVal === 'string' && rawVal.length > 18)

    fields.push({
      label,
      value: displayValue,
      span: isVeryLong ? 3 : isMidLong ? 2 : 1,
    })
  })

  const actionNodes = actionCols
    .map(col => (col.render ? col.render(readCell(rec, col), record, index) : null))
    .filter(Boolean)

  return {
    title,
    code,
    statusNode,
    avatarSeed: title,
    fields,
    actionNodes,
  }
}

// Helper to extract a stable row key from any record
function getRecordKey<T>(record: T, rowKey: TableProps<T>['rowKey'], index: number): React.Key {
  if (typeof rowKey === 'function') {
    return rowKey(record, index)
  }
  if (!isRecord(record)) return index
  if (typeof rowKey === 'string' && record[rowKey] !== undefined) {
    return record[rowKey] as React.Key
  }
  return (record.id as React.Key) ?? (record.key as React.Key) ?? index
}

// ---------------------------------------------------------------------------
// Main DataTable Component
// Renders standard table on desktop, and application card/list on mobile
// ---------------------------------------------------------------------------
export function DataTable<T extends AnyObject>({
  totalLabel = 'records',
  pagination,
  fillHeight = false,
  scroll,
  className,
  rowActions,
  renderRowActions,
  mobileCardRender,
  disableMobileCards = false,
  onRow,
  columns,
  dataSource,
  loading,
  rowKey,
  rowSelection,
  expandable,
  ...props
}: DataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredState, setHoveredState] = useState<{
    record: T
    top: number
    height: number
  } | null>(null)
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOverPopoverRef = useRef(false)

  // Responsive mobile detection (< 768px)
  const isMobile = useIsMobile()

  const handleRowMouseEnter = useCallback((record: T, tr: HTMLTableRowElement) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    const containerRect = containerRef.current?.getBoundingClientRect() ?? { top: 0, height: 0 }
    const trRect = tr.getBoundingClientRect()
    const top = trRect.top - containerRect.top
    const height = trRect.height || 40

    setHoveredState({
      record,
      top,
      height,
    })
  }, [])

  const handleRowMouseLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isOverPopoverRef.current) {
        setHoveredState(null)
      }
    }, 80)
  }, [])

  const handlePopoverMouseEnter = useCallback(() => {
    isOverPopoverRef.current = true
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }, [])

  const handlePopoverMouseLeave = useCallback(() => {
    isOverPopoverRef.current = false
    setHoveredState(null)
  }, [])

  // Clear desktop popover on table scroll or window resize
  useEffect(() => {
    const container = containerRef.current
    if (!container || (!rowActions && !renderRowActions)) return

    const handleScroll = () => {
      if (!isOverPopoverRef.current) {
        setHoveredState(null)
      }
    }

    const scrollTargets = container.querySelectorAll('.ant-table-body, .ant-table-content')
    scrollTargets.forEach(el => el.addEventListener('scroll', handleScroll, { passive: true }))
    window.addEventListener('resize', handleScroll)

    return () => {
      scrollTargets.forEach(el => el.removeEventListener('scroll', handleScroll))
      window.removeEventListener('resize', handleScroll)
    }
  }, [rowActions, renderRowActions])

  const mergedOnRow = useCallback(
    (record: T, index?: number) => {
      const callerProps = onRow ? onRow(record, index) : {}
      if (!rowActions && !renderRowActions) return callerProps

      return {
        ...callerProps,
        onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
          callerProps.onMouseEnter?.(e)
          handleRowMouseEnter(record, e.currentTarget)
        },
        onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
          callerProps.onMouseLeave?.(e)
          handleRowMouseLeave()
        },
      }
    },
    [onRow, rowActions, renderRowActions, handleRowMouseEnter, handleRowMouseLeave],
  )

  // Memoised so an undefined dataSource doesn't hand `pagedMobileData` a fresh
  // array identity on every render.
  const rawData = useMemo(() => dataSource ?? [], [dataSource])

  const callerPagination = typeof pagination === 'object' && pagination ? pagination : undefined

  // One page and page size shared by the desktop table and the mobile card list.
  // They used to be separate (antd's own uncontrolled state vs. these), so
  // crossing 768px — a rotation, a window resize — silently dropped the user
  // back to page 1. A caller's own values still win; server-side paging needs it.
  const [internalPage, setInternalPage] = useState(1)
  const [internalPageSize, setInternalPageSize] = useState(
    () => callerPagination?.pageSize ?? callerPagination?.defaultPageSize ?? 20,
  )

  const isServerPaged = callerPagination?.total !== undefined
  const currentPageSize = callerPagination?.pageSize ?? internalPageSize
  const totalRows = callerPagination?.total ?? rawData.length
  // antd clamps an uncontrolled page when the data shrinks under it. Now that we
  // drive `current`, we have to do it too, or filtering 100 rows down to 5 while
  // on page 5 leaves an empty table. Controlled callers keep full control.
  const lastPage = Math.max(1, Math.ceil(totalRows / currentPageSize))
  const currentPage = callerPagination?.current ?? Math.min(internalPage, lastPage)

  const handlePageChange = (page: number, size: number) => {
    setInternalPage(page)
    setInternalPageSize(size)
    callerPagination?.onChange?.(page, size)
  }

  const defaultPagination =
    pagination === false
      ? false
      : {
          showSizeChanger: true,
          showTotal: (count: number, range: [number, number]) =>
            `${range[0]}-${range[1]} of ${count} ${totalLabel}`,
          pageSizeOptions: [10, 20, 50, 100],
          responsive: true,
          ...callerPagination,
          current: currentPage,
          pageSize: currentPageSize,
          onChange: handlePageChange,
        }

  const mergedScroll = fillHeight
    ? { x: 'max-content', y: 1, ...scroll }
    : { x: 'max-content', ...scroll }

  const hasRowActions = Boolean(rowActions || renderRowActions)
  const currentActions = hoveredState && rowActions ? rowActions(hoveredState.record) : []
  const hasVisibleActions =
    Boolean(renderRowActions) ||
    currentActions.some(a => Boolean(a) && typeof a === 'object' && a !== null && !a.hidden)

  // ---------------------------------------------------------------------------
  // Mobile Card List Data Preparation & Handlers
  // ---------------------------------------------------------------------------
  const pagedMobileData = useMemo(() => {
    if (pagination === false || isServerPaged) {
      return rawData
    }
    const start = (currentPage - 1) * currentPageSize
    return rawData.slice(start, start + currentPageSize)
  }, [rawData, pagination, isServerPaged, currentPage, currentPageSize])

  // Mobile expandable rows state
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() => {
    if (expandable?.defaultExpandedRowKeys) {
      return [...expandable.defaultExpandedRowKeys]
    }
    return []
  })

  const activeExpandedKeys = expandable?.expandedRowKeys
    ? (expandable.expandedRowKeys as React.Key[])
    : expandedKeys

  const toggleExpandRow = (recKey: React.Key, rec: T) => {
    const isExpanded = activeExpandedKeys.includes(recKey)
    const nextKeys = isExpanded
      ? activeExpandedKeys.filter(k => k !== recKey)
      : [...activeExpandedKeys, recKey]

    if (!expandable?.expandedRowKeys) {
      setExpandedKeys(nextKeys)
    }
    if (expandable?.onExpand) {
      expandable.onExpand(!isExpanded, rec)
    }
    if (expandable?.onExpandedRowsChange) {
      expandable.onExpandedRowsChange(nextKeys)
    }
  }

  // Row selection handler for mobile cards
  const handleSelectRow = (recKey: React.Key, _rec: T, checked?: boolean) => {
    if (!rowSelection) return
    const isRadio = rowSelection.type === 'radio'
    const currentKeys = (rowSelection.selectedRowKeys ?? []) as React.Key[]
    let nextKeys: React.Key[] = []

    if (isRadio) {
      nextKeys = [recKey]
    } else {
      const isSelected = currentKeys.includes(recKey)
      const targetChecked = checked !== undefined ? checked : !isSelected
      if (targetChecked) {
        nextKeys = [...currentKeys, recKey]
      } else {
        nextKeys = currentKeys.filter(k => k !== recKey)
      }
    }

    if (rowSelection.onChange) {
      const selectedRows = rawData.filter((r, idx) => {
        const k = getRecordKey(r, rowKey, idx)
        return nextKeys.includes(k)
      })
      rowSelection.onChange(nextKeys, selectedRows, { type: 'single' })
    }
  }

  const isLoading = Boolean(typeof loading === 'boolean' ? loading : loading?.spinning)

  // antd's `ColumnsType` is a union that includes column groups; the card
  // extractor only ever reads the plain-column fields, which all exist on both.
  const cardColumns = columns as readonly CardColumn<T>[] | undefined

  return (
    <div
      ref={containerRef}
      className={[
        'erp-data-table-wrapper',
        fillHeight ? 'erp-data-table-wrapper--fill-height' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        height: fillHeight ? '100%' : undefined,
        display: fillHeight ? 'flex' : undefined,
        flexDirection: fillHeight ? 'column' : undefined,
        minHeight: 0,
        flex: fillHeight ? 1 : undefined,
      }}
    >
      {/* ====================================================================
          1. DESKTOP VIEW: Full Data Table with Sticky Columns & Row Actions
          ==================================================================== */}
      {(!isMobile || disableMobileCards) && (
        <div className="erp-desktop-table-view">
          <Table<T>
            size="middle"
            columns={columns}
            dataSource={dataSource}
            scroll={mergedScroll}
            pagination={defaultPagination}
            loading={loading}
            rowKey={rowKey}
            rowSelection={rowSelection}
            expandable={expandable}
            className={[fillHeight ? 'erp-fill-height-table' : null, className]
              .filter(Boolean)
              .join(' ')}
            onRow={hasRowActions ? mergedOnRow : onRow}
            {...props}
          />

          {hasRowActions && hoveredState && hasVisibleActions && (
            <div
              className="erp-floating-row-action-popover"
              style={{
                position: 'absolute',
                top: hoveredState.top + (hoveredState.height - 40) / 2,
                right: 12,
                zIndex: 25,
              }}
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
              onClick={e => e.stopPropagation()}
            >
              {renderRowActions ? (
                renderRowActions(hoveredState.record)
              ) : rowActions ? (
                <TableActionBar actions={currentActions} alwaysVisible mode="floating" />
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          2. MOBILE VIEW: Creative, Sober, Labeled Enterprise Cards
          ==================================================================== */}
      {isMobile && !disableMobileCards && (
        <div className="erp-mobile-card-view" aria-label="Mobile Application List View">
          {isLoading ? (
            <div className="erp-mobile-cards-stack">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="erp-mobile-card">
                  <Skeleton
                    active
                    avatar={{ size: 28, shape: 'square' }}
                    paragraph={{ rows: 2, width: ['60%', '90%'] }}
                    title={false}
                  />
                </div>
              ))}
            </div>
          ) : pagedMobileData.length === 0 ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No ${totalLabel} found`} />
            </div>
          ) : (
            <div className="erp-mobile-cards-stack">
              {pagedMobileData.map((record, index) => {
                const recordKey = getRecordKey(record, rowKey, index)
                const rowProps = onRow ? onRow(record, index) : {}
                // `hidden` is how pages gate an action they have no permission
                // for, so it has to drop the action here exactly as it does on
                // desktop — otherwise it still shows in the kebab, and a hidden
                // primary action makes the whole card tap fire it.
                const cardActions = rowActions
                  ? (rowActions(record).filter(
                      action => Boolean(action) && !(action as TableActionItem).hidden,
                    ) as TableActionItem[])
                  : []

                // Tapping the card body only ever runs an action the page marked
                // as its primary one. There is deliberately no "first action"
                // fallback: that made a whole-card tap fire whatever happened to
                // be at index 0, which on a list whose first action is destructive
                // is a one-tap data change with no confirmation. Everything else
                // stays reachable through the kebab menu.
                const primaryAction = cardActions.find(
                  a =>
                    a.variant !== 'danger' &&
                    !a.disabled &&
                    a.onClick &&
                    (a.variant === 'primary' || a.key === 'view' || a.key === 'edit'),
                )

                const isClickable =
                  Boolean(rowProps.onClick) || Boolean(primaryAction) || Boolean(rowSelection)

                const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
                  if (rowProps.onClick) {
                    rowProps.onClick(e)
                  } else if (primaryAction?.onClick) {
                    primaryAction.onClick(e as unknown as React.MouseEvent<HTMLElement>)
                  } else if (rowSelection) {
                    handleSelectRow(recordKey, record)
                  }
                }

                // Check expandable capabilities
                const canExpand = Boolean(
                  expandable &&
                  expandable.expandedRowRender &&
                  (!expandable.rowExpandable || expandable.rowExpandable(record)),
                )
                const isRowExpanded = activeExpandedKeys.includes(recordKey)

                // Extract structured, labeled card information
                const info = extractCardInfo(record, cardColumns, index)
                const avatarStyle = getAvatarStyle(info.avatarSeed)
                const initials = getInitials(info.title)

                const defaultCardNode = (
                  <div
                    key={recordKey}
                    className={[
                      'erp-mobile-card',
                      isClickable ? 'is-clickable' : '',
                      rowSelection?.selectedRowKeys?.includes(recordKey) ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={handleCardClick}
                  >
                    {/* Top Row: Select Checkbox + Avatar + Title & Code + Status Badge & Action Menu */}
                    <div className="erp-mobile-card-header">
                      {rowSelection && (
                        <div className="erp-mobile-card-select" onClick={e => e.stopPropagation()}>
                          {rowSelection.type === 'radio' ? (
                            <Radio
                              checked={rowSelection.selectedRowKeys?.includes(recordKey)}
                              onChange={() => handleSelectRow(recordKey, record, true)}
                            />
                          ) : (
                            <Checkbox
                              checked={rowSelection.selectedRowKeys?.includes(recordKey)}
                              onChange={e => handleSelectRow(recordKey, record, e.target.checked)}
                            />
                          )}
                        </div>
                      )}

                      <div className="erp-mobile-card-identity">
                        <div
                          className="erp-mobile-card-avatar"
                          style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                        >
                          {initials}
                        </div>
                        <div className="erp-mobile-card-title-group">
                          <div className="erp-mobile-card-title">{info.title}</div>
                          {info.code && (
                            <span className="erp-mobile-card-code-pill">{info.code}</span>
                          )}
                        </div>
                      </div>

                      <div className="erp-mobile-card-header-right">
                        {info.statusNode && (
                          <div onClick={e => e.stopPropagation()}>{info.statusNode}</div>
                        )}
                        {cardActions.length > 0 && (
                          <Dropdown
                            menu={{
                              items: cardActions.map(action => ({
                                key: action.key,
                                label: action.label,
                                icon: action.icon,
                                danger: action.variant === 'danger',
                                disabled: action.disabled,
                                onClick: itemEvent => {
                                  itemEvent.domEvent?.stopPropagation()
                                  if (action.onClick) {
                                    action.onClick(
                                      itemEvent.domEvent as unknown as React.MouseEvent<HTMLElement>,
                                    )
                                  }
                                },
                              })),
                            }}
                            trigger={['click']}
                          >
                            <button
                              type="button"
                              className="erp-mobile-action-kebab"
                              aria-label="Actions"
                              onClick={e => e.stopPropagation()}
                            >
                              <EllipsisOutlined />
                            </button>
                          </Dropdown>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Clear, Labeled 3-Column Fields Grid */}
                    {info.fields.length > 0 && (
                      <div className="erp-mobile-card-fields">
                        {info.fields.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className={[
                              'erp-mobile-field-item',
                              f.span === 3 ? 'is-span-3' : f.span === 2 ? 'is-span-2' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span className="erp-mobile-field-label">{f.label}</span>
                            <span className="erp-mobile-field-value">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Buttons a page rendered inside an "Action" column. Kept out
                        of the field grid so they aren't clipped by its ellipsis,
                        and click-isolated so tapping one doesn't also fire the
                        card's own tap action. */}
                    {info.actionNodes.length > 0 && (
                      <div className="erp-mobile-card-actions" onClick={e => e.stopPropagation()}>
                        {info.actionNodes.map((node, aIdx) => (
                          <React.Fragment key={aIdx}>{node}</React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Bottom Row: Sequence / Expand Button / View Details Link */}
                    <div className="erp-mobile-card-footer">
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        #{index + 1 + (currentPage - 1) * currentPageSize}
                      </span>

                      {canExpand ? (
                        <button
                          type="button"
                          className="erp-mobile-expand-btn"
                          onClick={e => {
                            e.stopPropagation()
                            toggleExpandRow(recordKey, record)
                          }}
                        >
                          <span>{isRowExpanded ? 'Hide items' : 'View items'}</span>
                          {isRowExpanded ? (
                            <UpOutlined style={{ fontSize: 9 }} />
                          ) : (
                            <DownOutlined style={{ fontSize: 9 }} />
                          )}
                        </button>
                      ) : isClickable ? (
                        <span className="erp-mobile-view-cue">
                          <span>View details</span>
                          <RightOutlined style={{ fontSize: 10 }} />
                        </span>
                      ) : null}
                    </div>

                    {/* Expanded Content Section (Sub-items / Nested Details) */}
                    {canExpand && isRowExpanded && expandable?.expandedRowRender && (
                      <div
                        className="erp-mobile-card-expanded-content"
                        onClick={e => e.stopPropagation()}
                      >
                        {expandable.expandedRowRender(record, index, 0, isRowExpanded)}
                      </div>
                    )}
                  </div>
                )

                if (mobileCardRender) {
                  return (
                    <React.Fragment key={recordKey}>
                      {mobileCardRender(record, index, defaultCardNode)}
                    </React.Fragment>
                  )
                }

                return defaultCardNode
              })}
            </div>
          )}

          {/* Mobile Pagination */}
          {pagination !== false && totalRows > currentPageSize && (
            <div className="erp-mobile-pagination-wrapper">
              <Pagination
                size="small"
                simple
                current={currentPage}
                pageSize={currentPageSize}
                total={totalRows}
                onChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Workaround: Storybook needs a named FC for autodocs
export const DataTableComponent: FC<DataTableProps<AnyObject>> = props => <DataTable {...props} />
