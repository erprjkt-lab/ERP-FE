export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function generateSequentialCode<T>(
  existing: T[],
  prefix: string,
  getCode: (item: T) => string,
): string {
  const maxNum = existing.reduce((max, item) => {
    const match = getCode(item).match(/(\d+)$/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`
}
