type DashboardHeaderProps = {
  isLoading: boolean
  onRefresh: () => void
}

export function DashboardHeader({ isLoading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="dashboard-head">
      <div>
        <div className="eyebrow">Interactive Trading Journal</div>
        <p className="hero-copy">
          Live performance view for your fixed Google Sheet with filters, analytics,
          and trade drilldown.
        </p>
      </div>

      <div className="head-actions">
        <button type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Refreshing data...' : 'Refresh data'}
        </button>
      </div>
    </div>
  )
}
