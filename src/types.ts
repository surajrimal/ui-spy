export type RowRecord = Record<string, string>

export type SortMode = 'newest' | 'oldest' | 'best' | 'worst'

export type TradeRow = {
  id: string
  dateLabel: string
  month: string
  buy: number
  sell: number
  net: number
  note: string
  dateValue: number
  raw: RowRecord
}

export type ChartRow = TradeRow & {
  width: string
}

export type TradeMetrics = {
  totalBuy: number
  totalSell: number
  totalNet: number
  wins: number
  losses: number
  bestDay: TradeRow | null
  worstDay: TradeRow | null
  averageNet: number
}
