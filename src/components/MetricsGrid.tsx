import type { TradeMetrics } from '../types'
import { formatCompact, formatCurrency } from '../utils/format'

type MetricsGridProps = {
  metrics: TradeMetrics
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <section className="metrics-grid" aria-label="Performance metrics">
      <article className="metric-card">
        <span className="status-label">Net P/L</span>
        <strong className={metrics.totalNet >= 0 ? 'profit' : 'loss'}>
          {formatCurrency(metrics.totalNet)}
        </strong>
        <p>{formatCurrency(metrics.averageNet)} average per row</p>
      </article>
      <article className="metric-card">
        <span className="status-label">Total buy</span>
        <strong>{formatCompact(metrics.totalBuy)}</strong>
        <p>{formatCurrency(metrics.totalBuy)} spent</p>
      </article>
      <article className="metric-card">
        <span className="status-label">Total sell</span>
        <strong>{formatCompact(metrics.totalSell)}</strong>
        <p>{formatCurrency(metrics.totalSell)} received</p>
      </article>
      <article className="metric-card">
        <span className="status-label">Win / loss days</span>
        <strong>
          {metrics.wins} / {metrics.losses}
        </strong>
        <p>Best day {metrics.bestDay ? formatCurrency(metrics.bestDay.net) : '$0.00'}</p>
      </article>
    </section>
  )
}
