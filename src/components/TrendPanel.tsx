import type { ChartRow } from '../types'
import { formatCurrency, formatDateLabel } from '../utils/format'

type TrendPanelProps = {
  chartRows: ChartRow[]
  selectedTradeId: string
  onSelectTrade: (tradeId: string) => void
}

export function TrendPanel({
  chartRows,
  selectedTradeId,
  onSelectTrade,
}: TrendPanelProps) {
  return (
    <article className="panel-card">
      <div className="panel-head">
        <h3>P/L trend</h3>
        <p>Bars scale relative to the strongest day in the current filter.</p>
      </div>
      <div className="trend-list">
        {chartRows.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`trend-row ${selectedTradeId === row.id ? 'active' : ''}`}
            onClick={() => onSelectTrade(row.id)}
          >
            <span className="trend-meta">
              <strong>{formatDateLabel(row.dateValue, row.dateLabel)}</strong>
              <small>{row.month}</small>
            </span>
            <span className="trend-bar-shell">
              <span
                className={`trend-bar ${row.net >= 0 ? 'profit-bar' : 'loss-bar'}`}
                style={{ width: row.width }}
              />
            </span>
            <span className={row.net >= 0 ? 'profit' : 'loss'}>
              {formatCurrency(row.net)}
            </span>
          </button>
        ))}
      </div>
    </article>
  )
}
