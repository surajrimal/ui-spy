import type { SortMode } from '../types'

type FilterToolbarProps = {
  query: string
  monthFilter: string
  months: string[]
  sortMode: SortMode
  disabled: boolean
  onQueryChange: (value: string) => void
  onMonthChange: (value: string) => void
  onSortChange: (value: SortMode) => void
}

export function FilterToolbar({
  query,
  monthFilter,
  months,
  sortMode,
  disabled,
  onQueryChange,
  onMonthChange,
  onSortChange,
}: FilterToolbarProps) {
  return (
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
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search dates, values, notes"
            aria-label="Search rows"
            disabled={disabled}
          />
        </label>

        <label className="field compact-field">
          <span>Month</span>
          <select
            value={monthFilter}
            onChange={(event) => onMonthChange(event.target.value)}
            disabled={disabled}
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
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            disabled={disabled}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="best">Best P/L</option>
            <option value="worst">Worst P/L</option>
          </select>
        </label>
      </div>
    </div>
  )
}
