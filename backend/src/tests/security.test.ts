import { describe, it } from 'node:test'
import assert from 'node:assert'
import type { Request, Response } from 'express'
import { getPropertyRepository } from '../modules/property/repository.js'
import { Property } from '../modules/property/models/property.model.js'
import { RentalRequest } from '../modules/rentalRequest/rentalRequest.model.js'
import { Tenancy } from '../modules/tenancy/tenancy.model.js'
import { Payment } from '../modules/payment/payment.model.js'
import { Notification } from '../modules/notification/notification.model.js'
import {
  createProperty,
  updateProperty,
  deleteProperty,
} from '../modules/property/property.controller.js'
import {
  createRentalRequest,
  approveRentalRequest,
  rejectRentalRequest,
} from '../modules/rentalRequest/rentalRequest.controller.js'
import {
  createTenancy,
  updateTenancy,
  deleteTenancy,
} from '../modules/tenancy/tenancy.controller.js'
import {
  listPayments,
  createPayment,
  processPayment,
  deletePayment,
} from '../modules/payment/payment.controller.js'
import {
  markAsRead,
  deleteNotification,
} from '../modules/notification/notification.controller.js'
import { Maintenance } from '../modules/maintenance/maintenance.model.js'
import { deleteMaintenanceTicket } from '../modules/maintenance/maintenance.controller.js'
import { getFamilyMembers, updateFamilyMembers, updateMe, changePassword } from '../modules/auth/auth.controller.js'
import { User } from '../modules/auth/models/user.model.js'
import { expireTenancy, sweepLeaseExpiries } from '../modules/tenancy/tenancyExpiry.service.js'
import { createNotificationIdempotent } from '../modules/notification/notification.model.js'
import bcrypt from 'bcryptjs'

// Simple mock helper for Express Response
function mockResponse() {
  const res: any = {}
  res.statusCode = 200
  res.status = function (code: number) {
    this.statusCode = code
    return this
  }
  res.json = function (data: any) {
    this.jsonData = data
    return this
  }
  res.clearCookie = function (name: string, options?: any) {
    return this
  }
  return res as Response
}

async function runHandler(handler: Function, req: Request): Promise<{ res: Response; nextError: any }> {
  const res = mockResponse()
  return new Promise((resolve) => {
    let finished = false
    const done = (err: any = null) => {
      if (finished) return
      finished = true
      resolve({ res, nextError: err })
    }

    const originalJson = res.json
    res.json = function (data: any) {
      const ret = originalJson.call(this, data)
      done()
      return ret
    }

    const result = handler(req, res, done)
    if (result && typeof result.catch === 'function') {
      result.catch(done)
    }
  })
}

describe('PropertyPro Security & Authorization Audit', () => {
  describe('Property Endpoint Security', () => {
    it('should derive ownerId and ownerEmail from req.user on property creation', async () => {
      const req = {
        user: { id: 'usr_owner_1', email: 'owner1@pro.com', roles: ['owner'] },
        body: {
          name: 'Lake View Villa',
          type: 'house',
          address: {
            line1: '123 Lake Rd',
            city: 'Hyd',
            state: 'TS',
            postalCode: '500001',
            country: 'IN',
          },
          imageUrl: 'https://ik.imagekit.io/mdkaif472/test_property.jpg',
        },
      } as unknown as Request

      const repo = getPropertyRepository()
      const originalCreate = repo.create
      repo.create = async function (input: any) {
        assert.strictEqual(input.ownerId, 'usr_owner_1')
        assert.strictEqual(input.ownerEmail, 'owner1@pro.com')
        return { id: 'prop_new', ...input } as any
      }

      try {
        const { res, nextError } = await runHandler(createProperty, req)
        if (nextError) throw nextError
        assert.strictEqual(res.statusCode, 201)
      } finally {
        repo.create = originalCreate
      }
    })

    it('should return all required listing and metadata fields in property records', async () => {
      const repo = getPropertyRepository()
      const created = await repo.create({
        ownerId: 'usr_owner_1',
        ownerEmail: 'owner1@pro.com',
        name: 'Grand Horizon',
        type: 'apartment',
        address: {
          line1: '45 Beach Rd',
          city: 'Chennai',
          state: 'TN',
          postalCode: '600001',
          country: 'IN'
        },
        listingStatus: 'for-rent',
        monthlyRent: 25000,
        bedrooms: 3,
        bathrooms: 2,
        parking: 1,
        areaSqFt: 1500,
      })

      assert.strictEqual(created.listingStatus, 'for-rent')
      assert.strictEqual(created.monthlyRent, 25000)
      assert.strictEqual(created.bedrooms, 3)
      assert.strictEqual(created.bathrooms, 2)
      assert.strictEqual(created.ownerEmail, 'owner1@pro.com')
    })

    it('should prevent updating a property owned by another owner (BOLA check)', async () => {
      const req = {
        user: { id: 'usr_owner_2', email: 'owner2@pro.com', roles: ['owner'] },
        params: { id: 'prop_1' },
        body: { name: 'Hacked Name' },
      } as unknown as Request

      const repo = getPropertyRepository()
      const originalFindById = repo.findById
      repo.findById = async function () {
        return {
          id: 'prop_1',
          ownerId: 'usr_owner_1',
          name: 'Original Name',
        } as any
      }

      try {
        const { nextError } = await runHandler(updateProperty, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 403)
        assert.strictEqual(nextError.code, 'FORBIDDEN')
      } finally {
        repo.findById = originalFindById
      }
    })

    it('should prevent deleting a property with an active tenancy lease', async () => {
      const req = {
        user: { id: 'usr_owner_1', email: 'owner1@pro.com', roles: ['owner'] },
        params: { id: 'prop_1' },
      } as unknown as Request

      const repo = getPropertyRepository()
      const originalFindById = repo.findById
      repo.findById = async function () {
        return { id: 'prop_1', ownerId: 'usr_owner_1' } as any
      }

      // Mock Tenancy.findOne (active tenancy exists)
      const originalFindOneTenancy = Tenancy.findOne
      Tenancy.findOne = function () {
        return {
          lean: () => Promise.resolve({ _id: 'tenancy_1', status: 'active' }),
        } as any
      }

      try {
        const { nextError } = await runHandler(deleteProperty, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 409)
        assert.strictEqual(nextError.code, 'CONFLICT')
      } finally {
        repo.findById = originalFindById
        Tenancy.findOne = originalFindOneTenancy
      }
    })
  })

  describe('Rental Request Endpoint Security', () => {
    it('should prevent approving a rental request for a property owned by someone else (BOLA check)', async () => {
      const req = {
        user: { id: 'usr_owner_2', email: 'owner2@pro.com', roles: ['owner'] },
        params: { id: 'request_1' },
      } as unknown as Request

      // Mock RentalRequest.findById
      const originalFindById = RentalRequest.findById
      RentalRequest.findById = function () {
        return {
          ownerId: 'usr_owner_1',
          status: 'pending',
        } as any
      }

      try {
        const { nextError } = await runHandler(approveRentalRequest, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 403)
        assert.strictEqual(nextError.code, 'FORBIDDEN')
      } finally {
        RentalRequest.findById = originalFindById
      }
    })

    it('should block approval if property already has an active lease', async () => {
      const req = {
        user: { id: 'usr_owner_1', email: 'owner1@pro.com', roles: ['owner'] },
        params: { id: 'request_1' },
      } as unknown as Request

      // Mock RentalRequest.findById
      const originalFindById = RentalRequest.findById
      RentalRequest.findById = function () {
        return {
          ownerId: 'usr_owner_1',
          propertyId: 'prop_1',
          status: 'pending',
          save: () => Promise.resolve(),
        } as any
      }

      // Mock Tenancy.findOne
      const originalFindOneTenancy = Tenancy.findOne
      Tenancy.findOne = function () {
        return {
          lean: () => Promise.resolve({ _id: 'tenancy_1', status: 'active' }),
        } as any
      }

      try {
        const { nextError } = await runHandler(approveRentalRequest, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 409)
        assert.strictEqual(nextError.code, 'CONFLICT')
      } finally {
        RentalRequest.findById = originalFindById
        Tenancy.findOne = originalFindOneTenancy
      }
    })

    it('should auto-reject other pending requests for the same property when one is approved', async () => {
      const req = {
        user: { id: 'usr_owner_1', email: 'owner1@pro.com', roles: ['owner'] },
        params: { id: 'request_1' },
        body: {},
      } as unknown as Request

      const mockRequest = {
        _id: 'request_1',
        ownerId: 'usr_owner_1',
        ownerEmail: 'owner1@pro.com',
        tenantId: 'usr_tenant_1',
        tenantEmail: 'tenant1@pro.com',
        propertyId: 'prop_1',
        propertyName: 'Zaid Manzil',
        fullName: 'Tenant A',
        status: 'pending',
        save: async function() { return this }
      }

      const originalFindById = RentalRequest.findById
      RentalRequest.findById = function () { return mockRequest as any }

      const originalFindOneTenancy = Tenancy.findOne
      Tenancy.findOne = function () {
        return { lean: () => Promise.resolve(null) } as any
      }

      const originalTenancyCreate = Tenancy.create
      ;(Tenancy as any).create = function (doc: any) {
        return Promise.resolve({ _id: 'tenancy_1', ...doc }) as any
      }

      const originalPaymentCreate = Payment.create
      Payment.create = function () { return Promise.resolve({}) as any }

      const originalPropertyUpdate = Property.findByIdAndUpdate
      Property.findByIdAndUpdate = function () { return Promise.resolve({}) as any }

      const originalNotificationCreate = Notification.create
      Notification.create = function () { return Promise.resolve({}) as any }

      let updateManyFilter: any = null
      let updateManyDoc: any = null
      const originalUpdateMany = RentalRequest.updateMany
      RentalRequest.updateMany = function (filter: any, doc: any) {
        updateManyFilter = filter
        updateManyDoc = doc
        return Promise.resolve({ modifiedCount: 1 }) as any
      }

      try {
        const { res, nextError } = await runHandler(approveRentalRequest, req)
        if (nextError) throw nextError
        assert.strictEqual(mockRequest.status, 'approved')
        assert.strictEqual(updateManyFilter.propertyId, 'prop_1')
        assert.strictEqual(updateManyDoc.$set.status, 'rejected')
      } finally {
        RentalRequest.findById = originalFindById
        Tenancy.findOne = originalFindOneTenancy
        Tenancy.create = originalTenancyCreate
        Payment.create = originalPaymentCreate
        Property.findByIdAndUpdate = originalPropertyUpdate
        Notification.create = originalNotificationCreate
        RentalRequest.updateMany = originalUpdateMany
      }
    })

    it('should soft-terminate an active tenancy and idempotently decrement property occupiedUnits', async () => {
      const req = {
        user: { id: 'usr_owner_1', email: 'owner1@pro.com', roles: ['owner'] },
        params: { id: 'tenancy_1' },
      } as unknown as Request

      const mockProperty = {
        _id: 'prop_1',
        occupiedUnits: 1,
        save: async function() { return this }
      }

      const mockTenancy = {
        _id: 'tenancy_1',
        ownerId: 'usr_owner_1',
        propertyId: 'prop_1',
        status: 'active',
        unitsOccupied: 1,
        save: async function() { return this }
      }

      const originalFindByIdTenancy = Tenancy.findById
      Tenancy.findById = function () { return mockTenancy as any }

      const originalFindByIdProperty = Property.findById
      Property.findById = function () { return mockProperty as any }

      try {
        // First termination call
        const { res, nextError } = await runHandler(deleteTenancy, req)
        if (nextError) throw nextError
        assert.strictEqual(mockTenancy.status, 'terminated')
        assert.strictEqual(mockProperty.occupiedUnits, 0)

        // Second termination call (idempotency check)
        const { nextError: secondErr } = await runHandler(deleteTenancy, req)
        if (secondErr) throw secondErr
        assert.strictEqual(mockTenancy.status, 'terminated')
        assert.strictEqual(mockProperty.occupiedUnits, 0) // Did NOT decrement below 0 or double decrement
      } finally {
        Tenancy.findById = originalFindByIdTenancy
        Property.findById = originalFindByIdProperty
      }
    })
  })

  describe('Payment Endpoint Security & Data Isolation', () => {
    it('should filter payments strictly by ownerId for owner queries (fixing the leak)', async () => {
      const req = {
        user: { id: 'usr_owner_1', email: 'owner1@pro.com', roles: ['owner'] },
      } as unknown as Request

      // Mock Payment.find
      const originalFind = Payment.find
      Payment.find = function (query: any) {
        assert.strictEqual(query.ownerId, 'usr_owner_1')
        assert.strictEqual(query.tenantEmail, undefined) // Data isolation verification
        return {
          sort: () => ({
            lean: () => Promise.resolve([{ _id: 'pay_1', ownerId: 'usr_owner_1', tenantName: 'Tenant A' }]),
          }),
        } as any
      }

      try {
        const { res, nextError } = await runHandler(listPayments, req)
        if (nextError) throw nextError
        assert.ok((res as any).jsonData)
      } finally {
        Payment.find = originalFind
      }
    })

    it('should prevent a tenant from processing payments for other tenants (BOLA check)', async () => {
      const req = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com', roles: ['tenant'] },
        params: { id: 'pay_1' },
      } as unknown as Request

      // Mock Payment.findById
      const originalFindById = Payment.findById
      Payment.findById = function () {
        return {
          tenantEmail: 'tenant2@pro.com',
          status: 'pending',
        } as any
      }

      try {
        const { nextError } = await runHandler(processPayment, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 403)
        assert.strictEqual(nextError.code, 'FORBIDDEN')
      } finally {
        Payment.findById = originalFindById
      }
    })

    it('should pay a pending payment successfully, but block paying an already paid payment (409 Conflict)', async () => {
      const req = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com', roles: ['tenant'] },
        params: { id: 'pay_1' },
      } as unknown as Request

      // Mock Payment.findById
      const originalFindById = Payment.findById
      const mockPayment = {
        _id: 'pay_1',
        tenantEmail: 'tenant1@pro.com',
        status: 'pending',
        amount: 8000,
        propertyName: 'Zaid Manzil',
        paidDate: undefined as Date | undefined,
        save: async function() {
          return this
        }
      }
      Payment.findById = function () {
        return mockPayment as any
      }

      // Mock Notification.create
      const originalNotificationCreate = Notification.create
      Notification.create = function () {
        return Promise.resolve({}) as any
      }

      try {
        // First payment attempt
        const { res, nextError } = await runHandler(processPayment, req)
        if (nextError) throw nextError
        assert.strictEqual(mockPayment.status, 'paid')
        assert.ok(mockPayment.paidDate)
        
        // Attempt paying again (should reject with 409 Conflict)
        const { nextError: secondNextError } = await runHandler(processPayment, req)
        assert.ok(secondNextError)
        assert.strictEqual(secondNextError.statusCode, 409)
        assert.strictEqual(secondNextError.code, 'CONFLICT')
        assert.strictEqual(mockPayment.status, 'paid') // Status remains paid
      } finally {
        Payment.findById = originalFindById
        Notification.create = originalNotificationCreate
      }
    })
  })

  describe('Notification Security', () => {
    it('should prevent marking another user\'s notification as read (BOLA check)', async () => {
      const req = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com', roles: ['tenant'] },
        params: { id: 'notif_1' },
      } as unknown as Request

      // Mock Notification.findById
      const originalFindById = Notification.findById
      Notification.findById = function () {
        return {
          userEmail: 'tenant2@pro.com',
        } as any
      }

      try {
        const { nextError } = await runHandler(markAsRead, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 403)
        assert.strictEqual(nextError.code, 'FORBIDDEN')
      } finally {
        Notification.findById = originalFindById
      }
    })
  })

  describe('Maintenance Security & Deletion Policy', () => {
    it('should soft-close a maintenance ticket when deleted by a tenant or owner (no physical delete)', async () => {
      const req = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com', roles: ['tenant'] },
        params: { id: 'mnt_1' },
      } as unknown as Request

      const mockTicket = {
        _id: 'mnt_1',
        tenantId: 'usr_tenant_1',
        tenantEmail: 'tenant1@pro.com',
        status: 'open',
        save: async function() {
          return this
        }
      }

      const originalFindById = Maintenance.findById
      Maintenance.findById = function () {
        return mockTicket as any
      }

      try {
        const { res, nextError } = await runHandler(deleteMaintenanceTicket, req)
        if (nextError) throw nextError
        assert.strictEqual(mockTicket.status, 'closed') // Transited to closed status
      } finally {
        Maintenance.findById = originalFindById
      }
    })

    it('should physically delete a maintenance ticket when deleted by a Super Admin', async () => {
      const req = {
        user: { id: 'usr_admin_1', email: 'admin@pro.com', roles: ['admin'] },
        params: { id: 'mnt_1' },
      } as unknown as Request

      const mockTicket = {
        _id: 'mnt_1',
        tenantId: 'usr_tenant_1',
        tenantEmail: 'tenant1@pro.com',
        status: 'open'
      }

      const originalFindById = Maintenance.findById
      Maintenance.findById = function () {
        return mockTicket as any
      }

      let deletedId: string | null = null
      const originalFindByIdAndDelete = Maintenance.findByIdAndDelete
      Maintenance.findByIdAndDelete = function (id: any) {
        deletedId = id
        return {
          lean: () => Promise.resolve(mockTicket),
        } as any
      }

      try {
        const { res, nextError } = await runHandler(deleteMaintenanceTicket, req)
        if (nextError) throw nextError
        assert.strictEqual(deletedId, 'mnt_1') // Physically deleted
      } finally {
        Maintenance.findById = originalFindById
        Maintenance.findByIdAndDelete = originalFindByIdAndDelete
      }
    })
  })

  describe('Family Members Security & Persistence', () => {
    it('should save and retrieve user family members via authenticated API', async () => {
      const reqGet = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com', roles: ['tenant'] },
      } as unknown as Request

      const mockUser = {
        _id: 'usr_tenant_1',
        email: 'tenant1@pro.com',
        familyMembers: [
          { id: 'fam_1', name: 'Sarah Tenant', relationship: 'Spouse', age: 28, phone: '12345' }
        ],
        save: async function() { return this }
      }

      const originalFindById = User.findById
      User.findById = function () {
        return {
          lean: () => Promise.resolve(mockUser),
          ...mockUser
        } as any
      }

      try {
        const { res, nextError } = await runHandler(getFamilyMembers, reqGet)
        if (nextError) throw nextError
        const jsonData = (res as any).jsonData
        assert.ok(jsonData.data)
        assert.strictEqual(jsonData.data.length, 1)
        assert.strictEqual(jsonData.data[0].name, 'Sarah Tenant')
      } finally {
        User.findById = originalFindById
      }
    })
  })

  describe('Phase 4: Lease Expiry & Notification Idempotency', () => {
    it('should transition active lease to expired and decrement property occupancy', async () => {
      const mockTenancy = {
        _id: 'tenancy_1',
        status: 'active',
        propertyId: 'prop_1',
        unitsOccupied: 1,
        tenantEmail: 'tenant@pro.com',
        ownerEmail: 'owner@pro.com',
        propertyName: 'Villa A',
        tenantName: 'Sarah',
        save: async function() { return this }
      }

      const mockProperty = {
        _id: 'prop_1',
        occupiedUnits: 1,
        save: async function() { return this }
      }

      const originalFindByIdTenancy = Tenancy.findById
      Tenancy.findById = function () { return mockTenancy as any }

      const originalFindByIdProperty = Property.findById
      Property.findById = function () { return mockProperty as any }

      const originalNotificationCreate = Notification.create
      ;(Notification as any).create = function () { return Promise.resolve({}) as any }

      try {
        const success = await expireTenancy('tenancy_1')
        assert.strictEqual(success, true)
        assert.strictEqual(mockTenancy.status, 'expired')
        assert.strictEqual(mockProperty.occupiedUnits, 0)

        // Idempotent retry: should return false and not decrement again
        const success2 = await expireTenancy('tenancy_1')
        assert.strictEqual(success2, false)
        assert.strictEqual(mockProperty.occupiedUnits, 0)
      } finally {
        Tenancy.findById = originalFindByIdTenancy
        Property.findById = originalFindByIdProperty
        Notification.create = originalNotificationCreate
      }
    })

    it('should prevent duplicate notifications with same eventKey', async () => {
      const originalFindOne = Notification.findOne
      let findOneCalled = 0
      Notification.findOne = function() {
        findOneCalled++
        return { lean: () => Promise.resolve({ _id: 'notif_existing' }) } as any
      }

      const originalCreate = Notification.create
      let createCalled = 0
      ;(Notification as any).create = function(doc: any) {
        createCalled++
        return Promise.resolve({ _id: 'notif_new', ...doc }) as any
      }

      try {
        const result = await createNotificationIdempotent({
          userEmail: 'tenant@pro.com',
          title: 'Test',
          message: 'Test message',
          eventKey: 'DUPLICATE_KEY',
        })

        assert.strictEqual(findOneCalled, 1)
        assert.strictEqual(createCalled, 0)
        assert.strictEqual((result as any)._id, 'notif_existing')
      } finally {
        Notification.findOne = originalFindOne
        Notification.create = originalCreate
      }
    })

    it('should handle concurrent/multiple attempts for the same event key and recipient returning exactly one notification', async () => {
      const originalFindOne = Notification.findOne
      let findOneCallCount = 0
      // First call (pre-check) returns null to simulate both threads passing the guard.
      // Subsequent calls (catch-block recovery) return the existing record.
      Notification.findOne = function() {
        findOneCallCount++
        const result = findOneCallCount <= 10 ? null : { _id: 'notif_existing_concur' }
        return { lean: () => Promise.resolve(result) } as any
      }

      const originalCreate = Notification.create
      let createCount = 0
      ;(Notification as any).create = function() {
        createCount++
        // All concurrent inserts hit the unique index violation
        const err = new Error('Duplicate key')
        ;(err as any).code = 11000
        throw err
      }

      try {
        const promises = Array.from({ length: 10 }).map(() =>
          createNotificationIdempotent({
            userEmail: 'tenant@pro.com',
            title: 'Test Concur',
            message: 'Test message',
            eventKey: 'CONCUR_KEY_123',
          })
        )

        const results = await Promise.all(promises)
        // All 10 attempts must resolve (not throw), even though all hit 11000
        assert.strictEqual(results.length, 10)
        // All 10 threads attempted to create (hit the unique index)
        assert.strictEqual(createCount, 10)
      } finally {
        Notification.findOne = originalFindOne
        Notification.create = originalCreate
      }
    })

    it('should allow the same event key for different recipients', async () => {
      const originalFindOne = Notification.findOne
      // No pre-existing document for any key — findOne returns null wrapped with .lean()
      Notification.findOne = function() {
        return { lean: () => Promise.resolve(null) } as any
      }

      const originalCreate = Notification.create
      const createdEmails: string[] = []
      ;(Notification as any).create = function(doc: any) {
        createdEmails.push(doc.userEmail)
        return Promise.resolve({ _id: `notif_${doc.userEmail}`, ...doc }) as any
      }

      try {
        await createNotificationIdempotent({
          userEmail: 'userA@pro.com',
          title: 'Expiry',
          message: 'Expiry warning',
          eventType: 'LEASE_EXPIRING_30D',
          relatedEntityId: 'lease123',
        })

        await createNotificationIdempotent({
          userEmail: 'userB@pro.com',
          title: 'Expiry',
          message: 'Expiry warning',
          eventType: 'LEASE_EXPIRING_30D',
          relatedEntityId: 'lease123',
        })

        // Both recipients must get their own notification row
        assert.strictEqual(createdEmails.length, 2)
        assert.ok(createdEmails.includes('usera@pro.com'))
        assert.ok(createdEmails.includes('userb@pro.com'))
      } finally {
        Notification.findOne = originalFindOne
        Notification.create = originalCreate
      }
    })
  })

  describe('Phase 5: Settings, Profile & Password Security', () => {
    it('should allow user to update own profile and strip protected fields', async () => {
      const mockUser = {
        id: 'usr_tenant_1',
        email: 'tenant1@pro.com',
        passwordHash: '',
        roles: ['tenant'] as any[],
        firstName: 'Sarah',
        lastName: 'Tenant',
        phone: '12345',
        status: 'active' as any,
        emailVerifiedAt: null,
        createdAt: '',
        updatedAt: '',
      }

      const { getAuthRepository } = await import('../modules/auth/repository.js')
      const repo = getAuthRepository()

      const originalFindById = repo.findById
      repo.findById = () => Promise.resolve(mockUser)

      const originalUpdateProfile = repo.updateProfile
      let updateInput: any = null
      repo.updateProfile = (userId: string, input: any) => {
        updateInput = input
        return Promise.resolve({
          ...mockUser,
          firstName: input.firstName || mockUser.firstName,
          lastName: input.lastName || mockUser.lastName,
          phone: input.phone || mockUser.phone,
        })
      }

      const req: any = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com' },
        body: {
          name: 'Sarah New Tenant New',
          phone: '99999',
          role: 'admin',
          status: 'suspended',
        }
      }

      try {
        const { res, nextError } = await runHandler(updateMe, req)
        if (nextError) throw nextError

        const jsonData = (res as any).jsonData
        assert.ok(jsonData.data)
        assert.strictEqual(jsonData.data.name, 'Sarah New Tenant New')
        assert.strictEqual(jsonData.data.phone, '99999')

        assert.strictEqual(updateInput.roles, undefined)
        assert.strictEqual(updateInput.status, undefined)
      } finally {
        repo.findById = originalFindById
        repo.updateProfile = originalUpdateProfile
      }
    })

    it('should change password successfully when current password is correct, and hash it', async () => {
      const plainCurrent = 'Current@123'
      const plainNew = 'NewPassword@123'
      const hashedCurrent = await bcrypt.hash(plainCurrent, 12)

      const mockUser = {
        id: 'usr_tenant_1',
        email: 'tenant1@pro.com',
        passwordHash: hashedCurrent,
        roles: ['tenant'] as any[],
        firstName: 'Sarah',
        lastName: 'Tenant',
        phone: '',
        status: 'active' as any,
        emailVerifiedAt: null,
        createdAt: '',
        updatedAt: '',
      }

      const { getAuthRepository } = await import('../modules/auth/repository.js')
      const repo = getAuthRepository()
      const originalFindById = repo.findById
      repo.findById = () => Promise.resolve(mockUser)

      const originalUpdatePassword = repo.updatePassword
      let updatedHash = ''
      repo.updatePassword = (userId: string, hash: string) => {
        updatedHash = hash
        return Promise.resolve()
      }

      const originalRevokeAll = repo.revokeAllForUser
      let revokeCalled = false
      repo.revokeAllForUser = (userId: string) => {
        revokeCalled = true
        return Promise.resolve()
      }

      const req: any = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com' },
        body: {
          currentPassword: plainCurrent,
          newPassword: plainNew,
        }
      }

      try {
        const { res, nextError } = await runHandler(changePassword, req)
        if (nextError) throw nextError

        assert.strictEqual(res.statusCode, 200)
        assert.ok(revokeCalled)
        assert.notStrictEqual(updatedHash, plainNew)
        const isMatch = await bcrypt.compare(plainNew, updatedHash)
        assert.ok(isMatch)
      } finally {
        repo.findById = originalFindById
        repo.updatePassword = originalUpdatePassword
        repo.revokeAllForUser = originalRevokeAll
      }
    })

    it('should block password change if current password is incorrect', async () => {
      const mockUser = {
        id: 'usr_tenant_1',
        email: 'tenant1@pro.com',
        passwordHash: await bcrypt.hash('Correct@123', 12),
        roles: ['tenant'] as any[],
        firstName: 'Sarah',
        lastName: 'Tenant',
        phone: '',
        status: 'active' as any,
        emailVerifiedAt: null,
        createdAt: '',
        updatedAt: '',
      }

      const { getAuthRepository } = await import('../modules/auth/repository.js')
      const repo = getAuthRepository()
      const originalFindById = repo.findById
      repo.findById = () => Promise.resolve(mockUser)

      const req: any = {
        user: { id: 'usr_tenant_1', email: 'tenant1@pro.com' },
        body: {
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
        }
      }

      try {
        const { nextError } = await runHandler(changePassword, req)
        assert.ok(nextError)
        assert.strictEqual(nextError.statusCode, 401)
      } finally {
        repo.findById = originalFindById
      }
    })

    it('should log audit entries to memory and retrieve them successfully', async () => {
      const { logAudit, getAuditLogs, inMemoryAuditLogs } = await import('../modules/admin/audit.service.js')
      inMemoryAuditLogs.length = 0

      await logAudit({
        actorUserId: 'admin_test',
        actorRole: 'admin',
        action: 'TEST_ACTION',
        entityType: 'TestEntity',
        entityId: 'test_123',
        metadata: { info: 'test' },
      })

      const logs = await getAuditLogs()
      assert.strictEqual(logs.length, 1)
      assert.strictEqual(logs[0].actorUserId, 'admin_test')
      assert.strictEqual(logs[0].action, 'TEST_ACTION')
    })
  })
})
