export interface CsvColumn<T> {
  header: string
  value: (row: T) => unknown
}

function escapeCell(value: unknown): string {
  if (value == null) return ''
  const text = String(value)
  // Quote whenever the cell could otherwise break the row or column split.
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => escapeCell(c.header)).join(',')
  const body = rows.map(row => columns.map(c => escapeCell(c.value(row))).join(','))
  return [header, ...body].join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM so Excel reads UTF-8 rather than the system codepage.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
