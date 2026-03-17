import type { RowRecord } from '../types'

function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let insideQuotes = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const nextChar = input[index + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1
      }
      currentRow.push(currentCell.trim())
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += char
  }

  currentRow.push(currentCell.trim())
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow)
  }

  return rows
}

export function normalizeSheetUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  const parts = url.pathname.split('/')
  const documentId = parts[3]

  if (!documentId) {
    throw new Error('Unable to find a Google Sheets document ID in that URL.')
  }

  const gid = (url.searchParams.get('gid') ?? url.hash.replace('#gid=', '')) || '0'
  return `https://docs.google.com/spreadsheets/d/${documentId}/export?format=csv&gid=${gid}`
}

export function buildRows(csvText: string): RowRecord[] {
  const matrix = parseCsv(csvText)
  if (matrix.length < 2) {
    return []
  }

  const [headerRow, ...dataRows] = matrix

  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row, rowIndex) =>
      headerRow.reduce<RowRecord>((record, heading, columnIndex) => {
        const safeHeading = heading || `Column ${columnIndex + 1}`
        record[safeHeading] = row[columnIndex] ?? ''
        record._rowId = `${rowIndex}`
        return record
      }, {}),
    )
}
