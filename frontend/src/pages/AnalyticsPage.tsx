import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  Percent,
  Download,
  Building2,
  PieChart,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatsCard } from '@/components/ui/StatsCard'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { useToast } from '@/hooks/useToast'

interface FinancialTrend {
  month: string
  revenue: number
  expenses: number
  profit: number
}

interface OperatingExpense {
  category: string
  percentage: number
  amount: number
}

interface PropertyPerformance {
  id: string
  name: string
  occupancy: string
  yield: string
  revenue: number
  expenses: number
  operatingIncome: number
}

interface AnalyticsData {
  summary: {
    totalRevenue: number
    operatingCost: number
    netOperatingIncome: number
    averageOccupancy: number
    averageOccupancyFormatted: string
  }
  financialTrends: FinancialTrend[]
  operatingExpenses: OperatingExpense[]
  propertyPerformance: PropertyPerformance[]
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState('6m')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<ApiEnvelope<AnalyticsData>>(`/analytics/overview?range=${period}`)
      if (res.data.data) {
        setData(res.data.data)
      } else {
        setError(res.data.error?.message || 'Failed to load analytics data')
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to fetch analytics from server')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchAnalytics()
  }, [period])

  const handleRetry = () => {
    void fetchAnalytics()
  }

  const handleExportReport = () => {
    if (!data) {
      toast.error('No analytics data available to export.')
      return
    }

    try {
      const dateStr = new Date().toISOString().split('T')[0]
      const periodLabel = period === '3m' ? 'Last 3 Months' : period === '12m' ? 'Last Year' : 'Last 6 Months'

      const rows: string[][] = []

      // Header Metadata
      rows.push(['PropertyPro Portfolio Analytics Report'])
      rows.push(['Reporting Period', periodLabel])
      rows.push(['Generated Date', new Date().toLocaleDateString()])
      rows.push([])

      // Portfolio Summary
      rows.push(['PORTFOLIO SUMMARY METRICS'])
      rows.push(['Metric', 'Value'])
      rows.push(['Total Revenue', String(data.summary.totalRevenue)])
      rows.push(['Operating Cost', String(data.summary.operatingCost)])
      rows.push(['Net Operating Income', String(data.summary.netOperatingIncome)])
      rows.push(['Average Occupancy', data.summary.averageOccupancyFormatted])
      rows.push([])

      // Property Performance Breakdown
      rows.push(['PROPERTY PERFORMANCE BREAKDOWN'])
      rows.push(['Property Name', 'Occupancy Rate', 'Rental Yield', 'Collected Revenue', 'Expenses', 'Operating Income'])
      if (data.propertyPerformance && data.propertyPerformance.length > 0) {
        data.propertyPerformance.forEach((p) => {
          rows.push([p.name, p.occupancy, p.yield, String(p.revenue), String(p.expenses), String(p.operatingIncome)])
        })
      } else {
        rows.push(['No property data available'])
      }
      rows.push([])

      // Financial Trends
      rows.push(['MONTHLY FINANCIAL TRENDS'])
      rows.push(['Month', 'Gross Revenue', 'Operating Expenses', 'Net Profit'])
      if (data.financialTrends && data.financialTrends.length > 0) {
        data.financialTrends.forEach((t) => {
          rows.push([t.month, String(t.revenue), String(t.expenses), String(t.profit)])
        })
      } else {
        rows.push(['No financial trend data available'])
      }
      rows.push([])

      // Operating Expenses Breakdown
      rows.push(['OPERATING EXPENSES BREAKDOWN'])
      rows.push(['Category', 'Amount', 'Percentage'])
      if (data.operatingExpenses && data.operatingExpenses.length > 0) {
        data.operatingExpenses.forEach((e) => {
          rows.push([e.category, String(e.amount), `${e.percentage}%`])
        })
      }

      // Format CSV
      const csvContent = rows
        .map((row) =>
          row
            .map((cell) => {
              const escaped = String(cell).replace(/"/g, '""')
              return `"${escaped}"`
            })
            .join(','),
        )
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `propertypro-analytics-${dateStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Analytics report exported successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export analytics report.')
    }
  }

  const summary = data?.summary || {
    totalRevenue: 0,
    operatingCost: 0,
    netOperatingIncome: 0,
    averageOccupancy: 0,
    averageOccupancyFormatted: '0%',
  }

  const financialTrends = data?.financialTrends || []
  const operatingExpenses = data?.operatingExpenses || []
  const propertyPerformance = data?.propertyPerformance || []

  // Compute max value for chart bar scaling
  const maxTrendValue = Math.max(
    ...financialTrends.map((t) => Math.max(t.revenue, t.expenses, t.profit)),
    10000,
  )

  const expenseColors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-neutral']

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">Portfolio Analytics</h1>
          <p className="text-sm text-muted">Real-time calculations derived directly from MongoDB records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select
            options={[
              { value: '3m', label: 'Last 3 Months' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '12m', label: 'Last Year' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <Button variant="secondary" size="md" onClick={handleExportReport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border bg-surface1 p-12">
          <Spinner label="Calculating portfolio analytics from database..." />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-center text-danger">
          <p className="font-semibold">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Stats Summary Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Revenue" value={formatPrice(summary.totalRevenue)} icon={DollarSign} />
            <StatsCard title="Operating Cost" value={formatPrice(summary.operatingCost)} icon={TrendingUp} />
            <StatsCard title="Net Operating Income" value={formatPrice(summary.netOperatingIncome)} icon={DollarSign} />
            <StatsCard title="Average Occupancy" value={summary.averageOccupancyFormatted} icon={Percent} />
          </div>

          {/* Analytics Charts & Graphs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Side: Financial Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
                <CardDescription>Monthly distribution of Gross Income, Expenses and Net Profit.</CardDescription>
              </CardHeader>
              <CardContent className="mt-4">
                {financialTrends.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted">
                    No payment trend data available for this range.
                  </div>
                ) : (
                  <>
                    <div className="relative flex h-64 w-full items-end justify-between border-b border-l border-border px-2 sm:px-6 pt-4 overflow-x-auto custom-scrollbar">
                      {financialTrends.map((item) => {
                        const revHeight = `${Math.max((item.revenue / maxTrendValue) * 100, 4)}%`
                        const expHeight = `${Math.max((item.expenses / maxTrendValue) * 100, 4)}%`
                        const profHeight = `${Math.max((Math.max(item.profit, 0) / maxTrendValue) * 100, 4)}%`

                        return (
                          <div key={item.month} className="group flex h-full w-12 flex-col items-center justify-end gap-2 shrink-0">
                            <div className="flex h-full w-full items-end justify-center gap-1">
                              {/* Revenue Bar */}
                              <div
                                style={{ height: revHeight }}
                                className="w-2.5 rounded-t-sm bg-primary transition-all group-hover:brightness-95"
                                title={`Revenue: ${formatPrice(item.revenue)}`}
                              />
                              {/* Profit Bar */}
                              <div
                                style={{ height: profHeight }}
                                className="w-2.5 rounded-t-sm bg-success transition-all group-hover:brightness-95"
                                title={`Profit: ${formatPrice(item.profit)}`}
                              />
                              {/* Expenses Bar */}
                              <div
                                style={{ height: expHeight }}
                                className="w-2.5 rounded-t-sm bg-danger transition-all group-hover:brightness-95"
                                title={`Expenses: ${formatPrice(item.expenses)}`}
                              />
                            </div>
                            <span className="mt-1 text-[11px] font-semibold text-muted">{item.month}</span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Chart Legend */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-primary" />
                        Gross Income
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-success" />
                        Net Profit
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-danger" />
                        Expenses
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right Side: Cost breakdown distribution list */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Expenses</CardTitle>
                <CardDescription>Maintenance & operational category distribution.</CardDescription>
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                {operatingExpenses.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-muted">
                    <PieChart className="h-8 w-8 opacity-40" />
                    <span>No logged maintenance expenses for this period.</span>
                  </div>
                ) : (
                  operatingExpenses.map((expense, idx) => {
                    const colorClass = expenseColors[idx % expenseColors.length]
                    return (
                      <div key={expense.category} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-text">{expense.category}</span>
                          <span className="text-muted">{expense.percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${expense.percentage}%` }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Yields Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Property</CardTitle>
              <CardDescription>Individual financial and yield metrics breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="mt-2 overflow-x-auto">
              {propertyPerformance.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-sm text-muted">
                  <Building2 className="h-8 w-8 opacity-40" />
                  <span>No properties found for this account.</span>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface2/50 text-[10px] font-bold uppercase tracking-wider text-muted">
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3 text-center">Occupancy Rate</th>
                      <th className="px-4 py-3 text-center">Rental Yield</th>
                      <th className="px-4 py-3 text-right">Collected Revenue</th>
                      <th className="px-4 py-3 text-right">Expenses</th>
                      <th className="px-4 py-3 text-right">Operating Income</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {propertyPerformance.map((prop) => (
                      <tr key={prop.id} className="hover:bg-surface2/30">
                        <td className="px-4 py-3 font-semibold text-text">{prop.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge intent="success" size="sm">{prop.occupancy}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge intent="primary" size="sm">{prop.yield}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-text">{formatPrice(prop.revenue)}</td>
                        <td className="px-4 py-3 text-right text-muted">{formatPrice(prop.expenses)}</td>
                        <td className="px-4 py-3 text-right font-bold text-success">
                          {formatPrice(prop.operatingIncome)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
