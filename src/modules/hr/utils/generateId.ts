export function formatEmployeeCode(id: number): string {
  return `EMP-${String(id).padStart(4, '0')}`
}
