import type { TradeRow } from '../types'
import { formatCurrency, formatDateLabel } from '../utils/format'

type TradeDetailPanelProps = {
  selectedTrade: TradeRow | null
}

export function TradeDetailPanel({ selectedTrade }: TradeDetailPanelProps) {
  return (
    <article className="panel-card detail-card">
      <div className="panel-head">
        <h3>Trade detail</h3>
        <p>Select a row from the trend list or ledger.</p>
      </div>

      {selectedTrade ? (
        <>
          <div className="detail-topline">
            <div>
              <span className="status-label">Selected date</span>
              <strong>{formatDateLabel(selectedTrade.dateValue, selectedTrade.dateLabel)}</strong>
            </div>
            <div>
              <span className="status-label">Net P/L</span>
              <strong className={selectedTrade.net >= 0 ? 'profit' : 'loss'}>
                {formatCurrency(selectedTrade.net)}
              </strong>
            </div>
          </div>

          <div className="detail-grid">
            <article>
              <span className="status-label">Buy</span>
              <strong>{formatCurrency(selectedTrade.buy)}</strong>
            </article>
            <article>
              <span className="status-label">Sell</span>
              <strong>{formatCurrency(selectedTrade.sell)}</strong>
            </article>
            <article>
              <span className="status-label">Month</span>
              <strong>{selectedTrade.month}</strong>
            </article>
            <article>
              <span className="status-label">Trade status</span>
              <strong>{selectedTrade.net >= 0 ? 'Green day' : 'Red day'}</strong>
            </article>
          </div>

          <div className="note-card">
            <span className="status-label">Notes / helper text</span>
            <p>{selectedTrade.note || 'No note stored on this row.'}</p>
          </div>
        </>
      ) : (
        <div className="empty-mini">No trade selected.</div>
      )}
    </article>
  )
}
