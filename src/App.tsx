import { useEffect, useMemo, useState } from 'react'

import { DashboardHeader } from './components/DashboardHeader'
import { FilterToolbar } from './components/FilterToolbar'
import { MetricsGrid } from './components/MetricsGrid'
import { StatusGrid } from './components/StatusGrid'
import { TradeDetailPanel } from './components/TradeDetailPanel'
import { TradeLedger } from './components/TradeLedger'
import { TrendPanel } from './components/TrendPanel'
import { ALL_MONTHS_OPTION, DEFAULT_SHEET_URL } from './constants'
import type { RowRecord, SortMode } from './types'
import { buildRows, normalizeSheetUrl } from './utils/sheet'
import {
  buildChartRows,
  filterAndSortTrades,
  getColumns,
  getMonthOptions,
  getTradeMetrics,
  parseTradeRows,
} from './utils/trades'

export default function App() {
  const [rows, setRows] = useState<RowRecord[]>([])
  const [query, setQuery] = useState('')
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_OPTION)
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [selectedTradeId, setSelectedTradeId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const columns = useMemo(() => getColumns(rows), [rows])
  const tradeRows = useMemo(() => parseTradeRows(rows), [rows])
  const months = useMemo(() => getMonthOptions(tradeRows), [tradeRows])
  const filteredTrades = useMemo(
    () => filterAndSortTrades(tradeRows, monthFilter, query, sortMode),
    [monthFilter, query, sortMode, tradeRows],
  )

  const selectedTrade = useMemo(() => {
    return (
      filteredTrades.find((trade) => trade.id === selectedTradeId) ??
      filteredTrades[0] ??
      null
    )
  }, [filteredTrades, selectedTradeId])

  const metrics = useMemo(() => getTradeMetrics(filteredTrades), [filteredTrades])
  const chartRows = useMemo(() => buildChartRows(filteredTrades), [filteredTrades])

  async function loadSheet(rawUrl: string = DEFAULT_SHEET_URL) {
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
        <DashboardHeader isLoading={isLoading} onRefresh={() => void loadSheet()} />
        <StatusGrid
          rowCount={tradeRows.length}
          monthCount={Math.max(months.length - 1, 0)}
          columnCount={columns.length}
        />

        {error ? <p className="error-banner">{error}</p> : null}

        <FilterToolbar
          query={query}
          monthFilter={monthFilter}
          months={months}
          sortMode={sortMode}
          disabled={tradeRows.length === 0}
          onQueryChange={setQuery}
          onMonthChange={setMonthFilter}
          onSortChange={setSortMode}
        />

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
            <MetricsGrid metrics={metrics} />

            <section className="board-grid">
              <TrendPanel
                chartRows={chartRows}
                selectedTradeId={selectedTrade?.id ?? ''}
                onSelectTrade={setSelectedTradeId}
              />
              <TradeDetailPanel selectedTrade={selectedTrade} />
            </section>

            <TradeLedger
              trades={filteredTrades}
              selectedTradeId={selectedTrade?.id ?? ''}
              onSelectTrade={setSelectedTradeId}
            />
          </>
        )}
      </section>
    </main>
  )
}
