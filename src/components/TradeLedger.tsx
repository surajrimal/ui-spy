import type { TradeRow } from '../types'
import { formatCurrency, formatDateLabel } from '../utils/format'

type TradeLedgerProps = {
  trades: TradeRow[]
  selectedTradeId: string
  onSelectTrade: (tradeId: string) => void
}

export function TradeLedger({
  trades,
  selectedTradeId,
  onSelectTrade,
}: TradeLedgerProps) {
  return (
    <section className="panel-card">
      <div className="panel-head">
        <h3>Trade ledger</h3>
        <p>Clickable rows with the raw values from the current sheet tab.</p>
      </div>
      <div className="mobile-ledger" aria-label="Trade ledger cards">
        {trades.map((trade) => (
          <button
            key={trade.id}
            type="button"
            className={`mobile-trade-card ${selectedTradeId === trade.id ? 'active' : ''}`}
            onClick={() => onSelectTrade(trade.id)}
          >
            <div className="mobile-trade-head">
              <strong>{formatDateLabel(trade.dateValue, trade.dateLabel)}</strong>
              <span className={trade.net >= 0 ? 'profit' : 'loss'}>
                {formatCurrency(trade.net)}
              </span>
            </div>
            <div className="mobile-trade-grid">
              <span>
                <small>Buy</small>
                <strong>{formatCurrency(trade.buy)}</strong>
              </span>
              <span>
                <small>Sell</small>
                <strong>{formatCurrency(trade.sell)}</strong>
              </span>
              <span>
                <small>Month</small>
                <strong>{trade.month}</strong>
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="table-shell" role="region" aria-label="Trade ledger">
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Buy</th>
              <th scope="col">Sell</th>
              <th scope="col">Net P/L</th>
              <th scope="col">Month</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr
                key={trade.id}
                className={selectedTradeId === trade.id ? 'selected-row' : ''}
                onClick={() => onSelectTrade(trade.id)}
              >
                <td>{formatDateLabel(trade.dateValue, trade.dateLabel)}</td>
                <td>{formatCurrency(trade.buy)}</td>
                <td>{formatCurrency(trade.sell)}</td>
                <td className={trade.net >= 0 ? 'profit' : 'loss'}>
                  {formatCurrency(trade.net)}
                </td>
                <td>{trade.month}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
