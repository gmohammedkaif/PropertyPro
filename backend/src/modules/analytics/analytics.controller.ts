import type { Request, Response } from 'express'
import { isDbConnected } from '../../db/connect.js'
import { Property } from '../property/models/property.model.js'
import { Payment } from '../payment/payment.model.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { Maintenance } from '../maintenance/maintenance.model.js'

export interface PropertyPerformanceItem {
  id: string
  name: string
  occupancy: string
  yield: string
  revenue: number
  expenses: number
  operatingIncome: number
}

export interface FinancialTrendItem {
  month: string
  revenue: number
  expenses: number
  profit: number
}

export interface OperatingExpenseItem {
  category: string
  percentage: number
  amount: number
}

export interface AnalyticsOverviewResponse {
  summary: {
    totalRevenue: number
    operatingCost: number
    netOperatingIncome: number
    averageOccupancy: number
    averageOccupancyFormatted: string
  }
  financialTrends: FinancialTrendItem[]
  operatingExpenses: OperatingExpenseItem[]
  propertyPerformance: PropertyPerformanceItem[]
}

export async function getAnalyticsOverview(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    res.status(401).json({ data: null, meta: {}, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
    return
  }

  const isAdmin = user.roles.includes('admin')
  const isOwner = user.roles.includes('owner') || user.roles.includes('agent')

  if (!isAdmin && !isOwner) {
    res.status(403).json({ data: null, meta: {}, error: { code: 'FORBIDDEN', message: 'Access denied' } })
    return
  }

  const range = (req.query.range as string) || '6m'
  let monthsCount = 6
  if (range === '3m') monthsCount = 3
  if (range === '12m') monthsCount = 12

  if (!isDbConnected()) {
    const now = new Date()
    const emptyTrends: FinancialTrendItem[] = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      emptyTrends.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        revenue: 0,
        expenses: 0,
        profit: 0,
      })
    }
    res.json({
      data: {
        summary: {
          totalRevenue: 0,
          operatingCost: 0,
          netOperatingIncome: 0,
          averageOccupancy: 0,
          averageOccupancyFormatted: '0%',
        },
        financialTrends: emptyTrends,
        operatingExpenses: [],
        propertyPerformance: [],
      },
      meta: { range, propertyCount: 0 },
      error: null,
    })
    return
  }

  // 1. Determine Property Scope
  const propertyFilter: Record<string, unknown> = { deletedAt: null }
  if (!isAdmin) {
    propertyFilter.$or = [
      { ownerId: user.id },
      { ownerEmail: user.email?.toLowerCase() },
    ]
  }

  const properties = await Property.find(propertyFilter).lean()
  const propertyIds = properties.map((p) => p._id.toString())
  const propertyNames = properties.map((p) => p.name)

  // 2. Determine Payment Scope
  const paymentFilter: Record<string, unknown> = {}
  if (!isAdmin) {
    paymentFilter.$or = [
      { ownerId: user.id },
      { ownerEmail: user.email?.toLowerCase() },
      { propertyId: { $in: propertyIds } },
      { propertyName: { $in: propertyNames } },
    ]
  }

  // Calculate Total Revenue (Only count paid rent/deposit payments)
  const paidPaymentFilter = {
    ...paymentFilter,
    status: 'paid' as const,
  }

  const paidPayments = await Payment.find(paidPaymentFilter).lean()

  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  // 3. Determine Maintenance / Operating Cost
  // Real operating costs from paid maintenance payments + maintenance tickets resolved
  const paidMaintenanceFilter = {
    ...paymentFilter,
    status: 'paid' as const,
    type: 'maintenance' as const,
  }
  const paidMaintenancePayments = await Payment.find(paidMaintenanceFilter).lean()
  const operatingCost = paidMaintenancePayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  // Net Operating Income
  const netOperatingIncome = totalRevenue - operatingCost

  // 4. Calculate Occupancy
  let totalUnitsCount = 0
  let occupiedUnitsCount = 0

  for (const prop of properties) {
    totalUnitsCount += prop.totalUnits || 0
    occupiedUnitsCount += prop.occupiedUnits || 0
  }

  const averageOccupancy = totalUnitsCount > 0 ? (occupiedUnitsCount / totalUnitsCount) * 100 : 0
  const averageOccupancyFormatted = `${averageOccupancy.toFixed(1)}%`

  // 5. Calculate Financial Trends (Monthly distribution for selected range)
  const now = new Date()
  const monthlyTrends: FinancialTrendItem[] = []

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const monthIndex = d.getMonth()
    const monthLabel = d.toLocaleString('en-US', { month: 'short' })

    const startOfMonth = new Date(year, monthIndex, 1)
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)

    const monthPaidPayments = paidPayments.filter((p) => {
      const pDate = p.paidDate ? new Date(p.paidDate) : new Date(p.createdAt)
      return pDate >= startOfMonth && pDate <= endOfMonth
    })

    const monthRevenue = monthPaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const monthExpenses = monthPaidPayments
      .filter((p) => p.type === 'maintenance')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const monthProfit = monthRevenue - monthExpenses

    monthlyTrends.push({
      month: monthLabel,
      revenue: monthRevenue,
      expenses: monthExpenses,
      profit: monthProfit,
    })
  }

  // 6. Calculate Operating Expenses Categories
  // Operating Expense Categories derived strictly from payment types or maintenance categories
  const maintenanceFilter: Record<string, unknown> = {}
  if (!isAdmin) {
    maintenanceFilter.$or = [
      { ownerId: user.id },
      { ownerEmail: user.email?.toLowerCase() },
      { propertyId: { $in: propertyIds } },
      { propertyName: { $in: propertyNames } },
    ]
  }

  const maintenanceTickets = await Maintenance.find(maintenanceFilter).lean()
  const categoryCounts: Record<string, number> = {}
  let totalTickets = maintenanceTickets.length

  for (const ticket of maintenanceTickets) {
    const cat = ticket.category || 'General Maintenance'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }

  const operatingExpenses: OperatingExpenseItem[] = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat,
    percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0,
    amount: operatingCost > 0 && totalTickets > 0 ? Math.round((count / totalTickets) * operatingCost) : 0,
  }))

  // 7. Calculate Performance by Property Table Data
  const propertyPerformance: PropertyPerformanceItem[] = properties.map((prop) => {
    const propId = prop._id.toString()
    const propPaidPayments = paidPayments.filter(
      (p) => p.propertyId === propId || p.propertyName.toLowerCase() === prop.name.toLowerCase(),
    )
    const propRevenue = propPaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const propExpenses = propPaidPayments
      .filter((p) => p.type === 'maintenance')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const propOpIncome = propRevenue - propExpenses

    const propOccupancyPct = prop.totalUnits > 0 ? ((prop.occupiedUnits || 0) / prop.totalUnits) * 100 : 0
    const propYieldPct = prop.monthlyRent > 0
      ? ((prop.monthlyRent * 12) / (prop.salePrice > 0 ? prop.salePrice : prop.monthlyRent * 120)) * 100
      : 0

    return {
      id: propId,
      name: prop.name,
      occupancy: `${propOccupancyPct.toFixed(0)}%`,
      yield: `${propYieldPct.toFixed(1)}%`,
      revenue: propRevenue,
      expenses: propExpenses,
      operatingIncome: propOpIncome,
    }
  })

  res.json({
    data: {
      summary: {
        totalRevenue,
        operatingCost,
        netOperatingIncome,
        averageOccupancy: Math.round(averageOccupancy),
        averageOccupancyFormatted,
      },
      financialTrends: monthlyTrends,
      operatingExpenses,
      propertyPerformance,
    },
    meta: {
      range,
      propertyCount: properties.length,
    },
    error: null,
  })
}
