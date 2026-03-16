import { useEffect, useMemo, useState } from 'react'

const defaultSheetUrl =
  'https://docs.google.com/spreadsheets/d/19KCx_PO6mRlBsZfDjyv5hUNkRUk_yDT8/edit?gid=2132622732#gid=2132622732'

type RowRecord = Record<string, string>

type TradeRow = {
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

function normalizeSheetUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  const parts = url.pathname.split('/')
  const documentId = parts[3]

  if (!documentId) {
    throw new Error('Unable to find a Google Sheets document ID in that URL.')
  }

  const gid = (url.searchParams.get('gid') ?? url.hash.replace('#gid=', '')) || '0'
  return `https://docs.google.com/spreadsheets/d/${documentId}/export?format=csv&gid=${gid}`
}

function buildRows(csvText: string): RowRecord[] {
  const matrix = parseCsv(csvText)
  if (matrix.length < 2) {
    return []
  }

  const [headerRow, ...dataRows] = matrix

  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row, rowIndex) => {
      return headerRow.reduce<RowRecord>((record, heading, columnIndex) => {
        const safeHeading = heading || `Column ${columnIndex + 1}`
        record[safeHeading] = row[columnIndex] ?? ''
        record._rowId = `${rowIndex}`
        return record
      }, {})
    })
}

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

function parseTradeRows(rows: RowRecord[]): TradeRow[] {
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

function formatDateLabel(value: number, fallback: string): string {
  if (!value) {
    return fallback
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

export default function App() {
  const [rows, setRows] = useState<RowRecord[]>([])
  const [query, setQuery] = useState('')
  const [monthFilter, setMonthFilter] = useState('All months')
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'best' | 'worst'>(
    'newest',
  )
  const [selectedTradeId, setSelectedTradeId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const columns = useMemo(() => {
    const firstRow = rows[0]
    if (!firstRow) {
      return []
    }

    return Object.keys(firstRow).filter((key) => key !== '_rowId' && key !== '')
  }, [rows])

  const tradeRows = useMemo(() => parseTradeRows(rows), [rows])

  const months = useMemo(() => {
    const allMonths = Array.from(new Set(tradeRows.map((row) => row.month).filter(Boolean)))
    return ['All months', ...allMonths]
  }, [tradeRows])

  const filteredTrades = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const nextRows = tradeRows.filter((row) => {
      const matchesMonth =
        monthFilter === 'All months' ? true : row.month === monthFilter

      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : Object.values(row.raw).some((value) =>
              value.toLowerCase().includes(normalizedQuery),
            )

      return matchesMonth && matchesQuery
    })

    return [...nextRows].sort((left, right) => {
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
  }, [monthFilter, query, sortMode, tradeRows])

  const selectedTrade = useMemo(() => {
    return (
      filteredTrades.find((trade) => trade.id === selectedTradeId) ??
      filteredTrades[0] ??
      null
    )
  }, [filteredTrades, selectedTradeId])

  const metrics = useMemo(() => {
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
  }, [filteredTrades])

  const chartRows = useMemo(() => {
    const peak = Math.max(...filteredTrades.map((row) => Math.abs(row.net)), 1)
    return filteredTrades.map((row) => ({
      ...row,
      width: `${Math.max((Math.abs(row.net) / peak) * 100, 8)}%`,
    }))
  }, [filteredTrades])

  async function loadSheet(rawUrl: string = defaultSheetUrl) {
    setError('')
    setIsLoading(true)

    try {
      const nextExportUrl = normalizeSheetUrl(rawUrl)

      const response = await fetch(nextExportUrl)
      if (!response.ok) {
        throw new Error(
          'Google Sheets did not return CSV data. Check that the file or tab is publicly accessible.',
        )
      }

      const csvText = await response.text()
      const nextRows = buildRows(csvText)

      if (nextRows.length === 0) {
        throw new Error(
          'No data rows were found. The first row should contain column headers.',
        )
      }

      setRows(nextRows)
      setSelectedTradeId(nextRows[0]?._rowId ?? '')
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'The sheet could not be loaded.'
      setRows([])
      setSelectedTradeId('')
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSheet()
  }, [])

  useEffect(() => {
    if (!filteredTrades.some((trade) => trade.id === selectedTradeId)) {
      setSelectedTradeId(filteredTrades[0]?.id ?? '')
    }
  }, [filteredTrades, selectedTradeId])

  return (
    <main className="page-shell">
      <section className="data-card">
        <div className="dashboard-head">
          <div>
            <div className="eyebrow">Interactive Trading Journal</div>
            <p className="hero-copy">
              Live performance view for your fixed Google Sheet with filters,
              analytics, and trade drilldown.
            </p>
          </div>

          <div className="head-actions">
            <button type="button" onClick={() => void loadSheet()} disabled={isLoading}>
              {isLoading ? 'Refreshing data...' : 'Refresh data'}
            </button>
          </div>
        </div>

        <div className="status-grid" aria-live="polite">
          <article>
            <span className="status-label">Rows loaded</span>
            <strong>{tradeRows.length}</strong>
          </article>
          <article>
            <span className="status-label">Months found</span>
            <strong>{Math.max(months.length - 1, 0)}</strong>
          </article>
          <article>
            <span className="status-label">Columns used</span>
            <strong>{columns.length}</strong>
          </article>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <div className="toolbar">
          <div>
            <h2>Performance board</h2>
            <p>Filter the journal, inspect trends, and open individual trades.</p>
          </div>

          <div className="toolbar-controls">
            <label className="field search-field">
              <span>Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dates, values, notes"
                aria-label="Search rows"
                disabled={tradeRows.length === 0}
              />
            </label>

            <label className="field compact-field">
              <span>Month</span>
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                disabled={tradeRows.length === 0}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            <label className="field compact-field">
              <span>Sort</span>
              <select
                value={sortMode}
                onChange={(event) =>
                  setSortMode(
                    event.target.value as 'newest' | 'oldest' | 'best' | 'worst',
                  )
                }
                disabled={tradeRows.length === 0}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="best">Best P/L</option>
                <option value="worst">Worst P/L</option>
              </select>
            </label>
          </div>
        </div>

        {tradeRows.length === 0 ? (
          <div className="empty-state">
            <p>No sheet data loaded yet.</p>
            <p>
              Use the spreadsheet link above. If this file is private, publish
              it to the web or expose it through a server-side proxy.
            </p>
          </div>
        ) : (
          <>
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
                <p>
                  Best day {metrics.bestDay ? formatCurrency(metrics.bestDay.net) : '$0.00'}
                </p>
              </article>
            </section>

            <section className="board-grid">
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
                      className={`trend-row ${selectedTrade?.id === row.id ? 'active' : ''}`}
                      onClick={() => setSelectedTradeId(row.id)}
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
            </section>

            <section className="panel-card">
              <div className="panel-head">
                <h3>Trade ledger</h3>
                <p>Clickable rows with the raw values from the current sheet tab.</p>
              </div>
              <div className="mobile-ledger" aria-label="Trade ledger cards">
                {filteredTrades.map((trade) => (
                  <button
                    key={trade.id}
                    type="button"
                    className={`mobile-trade-card ${selectedTrade?.id === trade.id ? 'active' : ''}`}
                    onClick={() => setSelectedTradeId(trade.id)}
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
                    {filteredTrades.map((trade) => (
                      <tr
                        key={trade.id}
                        className={selectedTrade?.id === trade.id ? 'selected-row' : ''}
                        onClick={() => setSelectedTradeId(trade.id)}
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
          </>
        )}
      </section>
    </main>
  )
}
