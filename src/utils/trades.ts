import { ALL_MONTHS_OPTION } from '../constants'
import type { ChartRow, RowRecord, SortMode, TradeMetrics, TradeRow } from '../types'

function parseCurrency(value: string): number {
  const normalized = value.replace(/[$,]/g, '').trim()
  if (!normalized) {
    return 0
  }

  const isNegative = normalized.startsWith('(') && normalized.endsWith(')')
  const amount = Number.parseFloat(normalized.replace(/[()]/g, ''))
  if (Number.isNaN(amount)) {
    return 0
  }

  return isNegative ? -amount : amount
}

export function getColumns(rows: RowRecord[]): string[] {
  const firstRow = rows[0]
  if (!firstRow) {
    return []
  }

  return Object.keys(firstRow).filter((key) => key !== '_rowId' && key !== '')
}

export function parseTradeRows(rows: RowRecord[]): TradeRow[] {
  return rows
    .map((row) => {
      const dateLabel = row.Date ?? row.date ?? ''
      const parsedDate = Date.parse(dateLabel)
      const note =
        row['How to use'] ??
        row.Notes ??
        row.Note ??
        row.Description ??
        ''

      return {
        id: row._rowId ?? dateLabel,
        dateLabel,
        month: row.Month ?? 'Unknown',
        buy: parseCurrency(row.Buy ?? ''),
        sell: parseCurrency(row.Sell ?? ''),
        net: parseCurrency(row['Net P/L'] ?? row.Net ?? ''),
        note,
        dateValue: Number.isNaN(parsedDate) ? 0 : parsedDate,
        raw: row,
      }
    })
    .filter((row) => row.dateLabel || row.buy !== 0 || row.sell !== 0 || row.net !== 0)
}

export function getMonthOptions(tradeRows: TradeRow[]): string[] {
  const allMonths = Array.from(new Set(tradeRows.map((row) => row.month).filter(Boolean)))
  return [ALL_MONTHS_OPTION, ...allMonths]
}

export function filterAndSortTrades(
  tradeRows: TradeRow[],
  monthFilter: string,
  query: string,
  sortMode: SortMode,
): TradeRow[] {
  const normalizedQuery = query.trim().toLowerCase()

  const filteredRows = tradeRows.filter((row) => {
    const matchesMonth =
      monthFilter === ALL_MONTHS_OPTION ? true : row.month === monthFilter

    const matchesQuery =
      normalizedQuery.length === 0
        ? true
        : Object.values(row.raw).some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          )

    return matchesMonth && matchesQuery
  })

  return [...filteredRows].sort((left, right) => {
    if (sortMode === 'oldest') {
      return left.dateValue - right.dateValue
    }

    if (sortMode === 'best') {
      return right.net - left.net
    }

    if (sortMode === 'worst') {
      return left.net - right.net
    }

    return right.dateValue - left.dateValue
  })
}

export function getTradeMetrics(filteredTrades: TradeRow[]): TradeMetrics {
  const totalBuy = filteredTrades.reduce((sum, row) => sum + row.buy, 0)
  const totalSell = filteredTrades.reduce((sum, row) => sum + row.sell, 0)
  const totalNet = filteredTrades.reduce((sum, row) => sum + row.net, 0)
  const wins = filteredTrades.filter((row) => row.net > 0).length
  const losses = filteredTrades.filter((row) => row.net < 0).length
  const bestDay = filteredTrades.reduce<TradeRow | null>((best, row) => {
    if (!best || row.net > best.net) {
      return row
    }
    return best
  }, null)
  const worstDay = filteredTrades.reduce<TradeRow | null>((worst, row) => {
    if (!worst || row.net < worst.net) {
      return row
    }
    return worst
  }, null)

  return {
    totalBuy,
    totalSell,
    totalNet,
    wins,
    losses,
    bestDay,
    worstDay,
    averageNet: filteredTrades.length === 0 ? 0 : totalNet / filteredTrades.length,
  }
}

export function buildChartRows(filteredTrades: TradeRow[]): ChartRow[] {
  const peak = Math.max(...filteredTrades.map((row) => Math.abs(row.net)), 1)

  return filteredTrades.map((row) => ({
    ...row,
    width: `${Math.max((Math.abs(row.net) / peak) * 100, 8)}%`,
  }))
}
