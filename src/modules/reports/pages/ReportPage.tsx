import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Card, Skeleton, Space, Table } from 'antd'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { ReportFilterBar } from '@/modules/reports/components/ReportFilterBar'
import { SalesFunnelView } from '@/modules/reports/components/SalesFunnelView'
import {
  fetchAllReportRows,
  useReport,
  useSalesFunnelReport,
} from '@/modules/reports/hooks/useReport'
import {
  findReport,
  type RegisteredReport,
  type ReportRowRecord,
} from '@/modules/reports/reportRegistry'
import { downloadCsv, toCsv, type CsvColumn } from '@/modules/reports/utils/exportCsv'
import type { ReportFilters } from '@/types/api/reports'

/** Antd column titles can be render functions; reports only ever use plain strings,
 * so anything else falls back to the column key for the CSV header. */
function csvColumns(report: RegisteredReport): CsvColumn<ReportRowRecord>[] {
  return report.columns.map(column => {
    const key = String('dataIndex' in column ? column.dataIndex : (column.key ?? ''))
    return {
      header: typeof column.title === 'string' ? column.title : key,
      value: row => row[key],
    }
  })
}

function SalesFunnelReportBody({ filters }: { filters: ReportFilters }) {
  const { data, isLoading, error } = useSalesFunnelReport(filters)

  if (error) {
    return (
      <Alert type="error" showIcon message={getErrorMessage(error, 'Could not load report.')} />
    )
  }
  if (isLoading || !data) {
    return <Skeleton active paragraph={{ rows: 5 }} />
  }
  return <SalesFunnelView stages={data.stages} />
}

function TableReportBody({
  report,
  filters,
}: {
  report: RegisteredReport
  filters: ReportFilters
}) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const { rows, meta, isLoading, error } = useReport<ReportRowRecord>(
    report.slug,
    filters,
    page,
    perPage,
  )
  const expand = report.expand

  if (error) {
    return (
      <Alert type="error" showIcon message={getErrorMessage(error, 'Could not load report.')} />
    )
  }

  return (
    <DataTable<ReportRowRecord>
      columns={report.columns}
      dataSource={rows}
      loading={isLoading}
      rowKey={(row, index) => String(row.id ?? index)}
      size="small"
      scroll={{ x: 'max-content' }}
      totalLabel="rows"
      expandable={
        expand && {
          expandedRowRender: row => (
            <Table
              size="small"
              pagination={false}
              columns={expand.columns}
              dataSource={(row[expand.key] as ReportRowRecord[]) ?? []}
              rowKey={(_, index) => String(index)}
            />
          ),
          rowExpandable: row => ((row[expand.key] as unknown[]) ?? []).length > 0,
        }
      }
      pagination={{
        current: meta?.current_page ?? page,
        pageSize: meta?.per_page ?? perPage,
        total: meta?.total ?? 0,
        showSizeChanger: true,
        onChange: (nextPage, nextSize) => {
          setPage(nextPage)
          setPerPage(nextSize)
        },
      }}
    />
  )
}

export default function ReportPage() {
  const { slug } = useParams<{ slug: string }>()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const report = findReport(slug)
  const [filters, setFilters] = useState<ReportFilters>({})
  const [exporting, setExporting] = useState(false)

  if (!report) {
    return <Navigate to="/reports" replace />
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = await fetchAllReportRows<ReportRowRecord>(report.slug, filters)
      if (rows.length === 0) {
        message.info('Nothing to export for these filters.')
        return
      }
      const filename = `${report.slug}-${new Date().toISOString().slice(0, 10)}.csv`
      downloadCsv(filename, toCsv(rows, csvColumns(report)))
    } catch (error) {
      message.error(getErrorMessage(error, 'Export failed.'))
    } finally {
      setExporting(false)
    }
  }

  const isFunnel = report.custom === 'sales-funnel'

  return (
    <>
      <PageHeader
        title={report.title}
        subtitle={report.description}
        breadcrumbs={[{ label: 'Reports', href: '/reports' }, { label: report.title }]}
        actions={
          <Space>
            {!isFunnel && (
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                Export CSV
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['report', report.slug] })}
            >
              Refresh
            </Button>
          </Space>
        }
      />
      <Card>
        <ReportFilterBar filterKeys={report.filters} value={filters} onChange={setFilters} />
        {isFunnel ? (
          <SalesFunnelReportBody filters={filters} />
        ) : (
          <TableReportBody report={report} filters={filters} />
        )}
      </Card>
    </>
  )
}
