import { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Percent,
  Download,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatsCard } from '@/components/ui/StatsCard'
import { Select } from '@/components/ui/Select'

// Seed data
const REVENUE_BY_MONTH = [
  { month: 'Jan', revenue: 120000, expenses: 34000, profit: 86000 },
  { month: 'Feb', revenue: 125000, expenses: 32000, profit: 93000 },
  { month: 'Mar', revenue: 130000, expenses: 45000, profit: 85000 },
  { month: 'Apr', revenue: 135000, expenses: 31000, profit: 104000 },
  { month: 'May', revenue: 140000, expenses: 38000, profit: 102000 },
  { month: 'Jun', revenue: 145000, expenses: 40000, profit: 105000 },
  { month: 'Jul', revenue: 150000, expenses: 42000, profit: 108000 },
]

const PROPERTY_PERFORMANCE = [
  { name: 'Hassan Villa', occupancy: '100%', yield: '8.4%', revenue: 540000, expenses: 110000 },
  { name: 'Green Park Residency', occupancy: '92%', yield: '7.8%', revenue: 336000, expenses: 68000 },
  { name: 'Sunrise Heights Studio', occupancy: '100%', yield: '9.1%', revenue: 216000, expenses: 40000 },
  { name: 'Business District Comm.', occupancy: '75%', yield: '11.2%', revenue: 1440000, expenses: 220000 },
]

export function AnalyticsPage() {
  const [period, setPeriod] = useState('6m')

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Calculate stats from performance data
  const totalRevenue = PROPERTY_PERFORMANCE.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = PROPERTY_PERFORMANCE.reduce((sum, item) => sum + item.expenses, 0)
  const netProfit = totalRevenue - totalExpenses

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">Portfolio Analytics</h1>
          <p className="text-sm text-muted">Examine profit margins, occupancy performance and investment yields.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '3m', label: 'Last 3 Months' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '12m', label: 'Last Year' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <Button variant="secondary" size="md">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Revenue" value={formatPrice(totalRevenue)} icon={DollarSign} />
        <StatsCard title="Operating Cost" value={formatPrice(totalExpenses)} icon={TrendingUp} />
        <StatsCard title="Net Operating Income" value={formatPrice(netProfit)} icon={DollarSign} />
        <StatsCard title="Average Occupancy" value="91.7%" icon={Percent} />
      </div>

      {/* Analytics Charts & Graphs Mock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Financial Chart Mock */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Financial Trends</CardTitle>
            <CardDescription>Monthly distribution of Gross Income, Expenses and Profits.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="relative h-64 w-full border-b border-l border-border flex items-end justify-between px-6 pt-4">
              {REVENUE_BY_MONTH.map((item) => {
                const maxVal = 200000
                const revHeight = `${(item.revenue / maxVal) * 100}%`
                const expHeight = `${(item.expenses / maxVal) * 100}%`
                const profHeight = `${(item.profit / maxVal) * 100}%`

                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 w-12 h-full justify-end group">
                    <div className="flex gap-1 w-full h-full items-end justify-center">
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
                    <span className="text-[11px] font-semibold text-muted mt-1">{item.month}</span>
                  </div>
                )
              })}
            </div>
            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary" />
                Gross Income
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-success" />
                Net profit
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-danger" />
                Expenses
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Cost breakdown distribution list */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Expenses</CardTitle>
            <CardDescription>Cost allocations for portfolios.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text">Property Repairs</span>
                <span className="text-muted">38%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '38%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text">Utility Bills & Taxes</span>
                <span className="text-muted">26%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '26%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text">Broker Commissions</span>
                <span className="text-muted">18%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text">Insurance Policies</span>
                <span className="text-muted">12%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                <div className="h-full bg-info rounded-full" style={{ width: '12%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text">Other Operations</span>
                <span className="text-muted">6%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
                <div className="h-full bg-neutral rounded-full" style={{ width: '6%' }} />
              </div>
            </div>
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
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase font-bold text-muted tracking-wider">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3 text-center">Occupancy Rate</th>
                <th className="px-4 py-3 text-center">Rental Yield</th>
                <th className="px-4 py-3 text-right">Annualized Revenue</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Operating Income</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {PROPERTY_PERFORMANCE.map((prop) => (
                <tr key={prop.name} className="hover:bg-surface2/30">
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
                    {formatPrice(prop.revenue - prop.expenses)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
