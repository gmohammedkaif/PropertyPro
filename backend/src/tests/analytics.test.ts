import { describe, it } from 'node:test'
import assert from 'node:assert'
import type { Request, Response } from 'express'
import { getAnalyticsOverview } from '../modules/analytics/analytics.controller.js'

function mockRes() {
  const res: Partial<Response> & { statusCode?: number; jsonData?: any } = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code
      return this as Response
    },
    json(data: any) {
      this.jsonData = data
      return this as Response
    },
  }
  return res as Response & { statusCode: number; jsonData: any }
}

describe('Analytics Module Security & Calculation Tests', () => {
  it('should block unauthenticated requests with 401', async () => {
    const req = { user: undefined, query: {} } as unknown as Request
    const res = mockRes()
    await getAnalyticsOverview(req, res)
    assert.strictEqual(res.statusCode, 401)
    assert.strictEqual(res.jsonData.error.code, 'UNAUTHORIZED')
  })

  it('should block TENANT users with 403 Forbidden', async () => {
    const req = {
      user: { id: 'usr_tenant_1', roles: ['tenant'], email: 'tenant@test.com' },
      query: {},
    } as unknown as Request
    const res = mockRes()
    await getAnalyticsOverview(req, res)
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(res.jsonData.error.code, 'FORBIDDEN')
  })

  it('should allow Super Admin and return system-wide analytics structure', async () => {
    const req = {
      user: { id: 'usr_admin_1', roles: ['admin'], email: 'admin@propertypro.com' },
      query: { range: '6m' },
    } as unknown as Request
    const res = mockRes()
    await getAnalyticsOverview(req, res)
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.jsonData.data.summary)
    assert.ok(typeof res.jsonData.data.summary.totalRevenue === 'number')
    assert.ok(typeof res.jsonData.data.summary.operatingCost === 'number')
    assert.ok(typeof res.jsonData.data.summary.netOperatingIncome === 'number')
    assert.ok(typeof res.jsonData.data.summary.averageOccupancy === 'number')
    assert.ok(Array.isArray(res.jsonData.data.financialTrends))
    assert.strictEqual(res.jsonData.data.financialTrends.length, 6)
  })

  it('should allow Owner and scope analytics to their properties only', async () => {
    const req = {
      user: { id: 'usr_owner_99', roles: ['owner'], email: 'owner99@propertypro.com' },
      query: { range: '3m' },
    } as unknown as Request
    const res = mockRes()
    await getAnalyticsOverview(req, res)
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.jsonData.data.summary)
    assert.strictEqual(res.jsonData.data.financialTrends.length, 3)
  })
})
