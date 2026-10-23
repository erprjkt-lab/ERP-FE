import dayjs from 'dayjs'

const DATE = 'DD-MM-YYYY'
const DATE_TIME = 'DD-MM-YYYY HH:mm'

/** Single display format for every date shown in the app.
 *
 *  ERP-BE sends document dates as plain `YYYY-MM-DD` (they are DATE columns, so
 *  there is no time to show) and real timestamps as full ISO. The time is
 *  appended only when the value carries one, so a column starts showing HH:mm
 *  by itself if its backing column ever becomes a datetime.
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return String(value)
  return parsed.format(/\d{2}:\d{2}/.test(value) ? DATE_TIME : DATE)
}
