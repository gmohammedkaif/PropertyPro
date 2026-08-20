import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getPropertyRepository } from '../modules/property/repository.js'

describe('Marketplace & Property Availability Tests', () => {
  it('should return available properties listed for-rent and for-sale', async () => {
    const repo = getPropertyRepository()
    
    // Create a property listed for rent
    const prop1 = await repo.create({
      ownerId: 'usr_owner_t1',
      ownerEmail: 'owner_t1@pro.com',
      name: 'Available Rental Villa',
      type: 'house',
      address: {
        line1: '123 Main St',
        city: 'Vellore',
        state: 'Tamil Nadu',
        postalCode: '632014',
        country: 'IN'
      },
      imageUrl: 'https://ik.imagekit.io/mdkaif472/prop1.jpg',
      listingStatus: 'for-rent',
      totalUnits: 1,
      occupiedUnits: 0,
      monthlyRent: 12000
    })

    const results = await repo.findAllPublished({})
    const items = results.items

    // Verify prop1 is in the results
    const found = items.find(item => item.id === prop1.id)
    assert.ok(found)
    assert.strictEqual(found.name, 'Available Rental Villa')
    assert.strictEqual(found.address.city, 'Vellore')
    assert.strictEqual(found.imageUrl, 'https://ik.imagekit.io/mdkaif472/prop1.jpg')
    assert.strictEqual(found.monthlyRent, 12000)
  })

  it('should exclude fully occupied properties from published list', async () => {
    const repo = getPropertyRepository()

    const propOccupied = await repo.create({
      ownerId: 'usr_owner_t1',
      ownerEmail: 'owner_t1@pro.com',
      name: 'Fully Occupied Apartment',
      type: 'apartment',
      address: {
        line1: '456 Side St',
        city: 'Ambur',
        state: 'Tamil Nadu',
        postalCode: '635802',
        country: 'IN'
      },
      imageUrl: 'https://ik.imagekit.io/mdkaif472/prop2.jpg',
      listingStatus: 'for-rent',
      totalUnits: 2,
      occupiedUnits: 2,
      monthlyRent: 15000
    })

    const results = await repo.findAllPublished({})
    const found = results.items.find(item => item.id === propOccupied.id)
    assert.strictEqual(found, undefined, 'Fully occupied property must not be returned in published list')
  })

  it('should exclude soft-deleted and inactive properties', async () => {
    const repo = getPropertyRepository()

    const propInactive = await repo.create({
      ownerId: 'usr_owner_t1',
      ownerEmail: 'owner_t1@pro.com',
      name: 'Inactive Mansion',
      type: 'house',
      address: {
        line1: '789 Gated Rd',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'IN'
      },
      imageUrl: 'https://ik.imagekit.io/mdkaif472/prop3.jpg',
      listingStatus: 'for-rent',
      totalUnits: 1,
      occupiedUnits: 0
    })

    // Explicitly update to inactive
    await repo.update(propInactive.id, { listingStatus: 'inactive' })

    const results = await repo.findAllPublished({})
    const foundInactive = results.items.find(item => item.id === propInactive.id)
    assert.strictEqual(foundInactive, undefined, 'Inactive property must not be returned')

    // Test soft deleted
    const propDeleted = await repo.create({
      ownerId: 'usr_owner_t1',
      ownerEmail: 'owner_t1@pro.com',
      name: 'Deleted Condo',
      type: 'apartment',
      address: {
        line1: '99 Deleted Ave',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN'
      },
      imageUrl: 'https://ik.imagekit.io/mdkaif472/prop4.jpg',
      listingStatus: 'for-rent',
      totalUnits: 1,
      occupiedUnits: 0
    })

    await repo.softDelete(propDeleted.id)

    const resultsAfterDelete = await repo.findAllPublished({})
    const foundDeleted = resultsAfterDelete.items.find(item => item.id === propDeleted.id)
    assert.strictEqual(foundDeleted, undefined, 'Deleted property must not be returned')
  })

  it('should not contain duplicate properties in the returned list', async () => {
    const repo = getPropertyRepository()
    const results = await repo.findAllPublished({})
    const ids = results.items.map(item => item.id)
    const uniqueIds = new Set(ids)
    assert.strictEqual(ids.length, uniqueIds.size, 'The list should not contain duplicates')
  })

  it('should not inject default static Hyderabad data into created properties', async () => {
    const repo = getPropertyRepository()
    const prop = await repo.create({
      ownerId: 'usr_owner_t2',
      ownerEmail: 'owner_t2@pro.com',
      name: 'Kensington Court',
      type: 'resort',
      address: {
        line1: '10 Queens Way',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN'
      },
      imageUrl: 'https://ik.imagekit.io/mdkaif472/prop5.jpg',
      listingStatus: 'for-rent'
    })

    const fetched = await repo.findById(prop.id)
    assert.ok(fetched)
    assert.strictEqual(fetched.address.city, 'Mumbai')
    assert.notStrictEqual(fetched.address.city, 'Hyderabad', 'City should be Mumbai, not fallback Hyderabad')
  })
})
