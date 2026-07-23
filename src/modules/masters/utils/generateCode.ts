export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function generateSequentialCode(existing: { code: string }[], prefix: string): string {
  const maxNum = existing.reduce((max, item) => {
    const match = item.code.match(/(\d+)$/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`
}
