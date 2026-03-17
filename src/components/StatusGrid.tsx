type StatusGridProps = {
  rowCount: number
  monthCount: number
  columnCount: number
}

export function StatusGrid({ rowCount, monthCount, columnCount }: StatusGridProps) {
  return (
    <div className="status-grid" aria-live="polite">
      <article>
        <span className="status-label">Rows loaded</span>
        <strong>{rowCount}</strong>
      </article>
      <article>
        <span className="status-label">Months found</span>
        <strong>{monthCount}</strong>
      </article>
      <article>
        <span className="status-label">Columns used</span>
        <strong>{columnCount}</strong>
      </article>
    </div>
  )
}
