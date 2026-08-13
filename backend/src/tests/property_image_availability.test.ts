import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createPropertySchema } from '../modules/property/property.schemas.js'
import { MongoPropertyRepository } from '../modules/property/mongoProperty.repository.js'

describe('Property Image & Availability Integration Tests', () => {
  it('should reject property creation without an image URL', () => {
    const input = {
      ownerId: 'usr_owner_1',
      name: 'Test Villa',
      type: 'house',
      address: {
        line1: '123 Main St',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500001',
        country: 'IN',
      },
    }

    const res = createPropertySchema.safeParse(input)
    assert.strictEqual(res.success, false)
  })

  it('should reject property creation with non-ImageKit URL', () => {
    const input = {
      ownerId: 'usr_owner_1',
      name: 'Test Villa',
      type: 'house',
      imageUrl: 'https://via.placeholder.com/150',
      address: {
        line1: '123 Main St',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500001',
        country: 'IN',
      },
    }

    const res = createPropertySchema.safeParse(input)
    assert.strictEqual(res.success, false)
  })

  it('should accept property creation with a valid ImageKit URL', () => {
    const input = {
      ownerId: 'usr_owner_1',
      name: 'Test Villa',
      type: 'house',
      imageUrl: 'https://ik.imagekit.io/mdkaif472/property_test.jpg',
      address: {
        line1: '123 Main St',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500001',
        country: 'IN',
      },
    }

    const res = createPropertySchema.safeParse(input)
    assert.strictEqual(res.success, true)
    if (res.success) {
      assert.strictEqual(res.data.imageUrl, 'https://ik.imagekit.io/mdkaif472/property_test.jpg')
    }
  })
})
