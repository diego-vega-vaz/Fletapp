// Exportación de datos a CSV (compatible con Excel — incluye BOM UTF-8)

export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

function escapeCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  // Si contiene comillas, comas o saltos de línea, se envuelve en comillas
  if (/["\n,;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]) {
  const head = columns.map(c => escapeCell(c.header)).join(',')
  const body = rows.map(r => columns.map(c => escapeCell(c.value(r))).join(',')).join('\n')
  const csv = '﻿' + head + '\n' + body // BOM para que Excel respete UTF-8

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper para fechas legibles en español
export const csvDate = (d: string | null | undefined): string =>
  d ? new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
