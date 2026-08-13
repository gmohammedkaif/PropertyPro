import { randomUUID } from 'node:crypto'

import { persistentDb } from '../../core/persistentDb.js'
import type { PropertyRepository } from './property.repository.js'
import type {
  PropertyRecord,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilter,
  PropertyListResult,
} from './property.types.js'

export class InMemoryPropertyRepository implements PropertyRepository {
  private properties: Map<string, PropertyRecord>

  constructor() {
    this.properties = persistentDb.loadProperties()
    if (this.properties.size === 0) {
      this.seedDefaultProperties()
    }
  }

  private seedDefaultProperties() {
    const now = new Date().toISOString()
    const seedData: Omit<PropertyRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        ownerId: 'usr_demo',
        name: 'Zaid Manzil',
        type: 'house',
        address: {
          line1: 'Yerthangal hakeem',
          line2: null,
          city: 'Pernambut',
          state: 'Tamil Nadu',
          postalCode: '635810',
          country: 'India'
        },
        location: null,
        description: 'Spacious family house with private compound.',
        amenities: ['Parking', 'Water Supply'],
        totalUnits: 18,
        occupiedUnits: 18,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'Urban Nest Apartments',
        type: 'apartment',
        address: {
          line1: 'OMR Road, Navalur',
          line2: null,
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '603103',
          country: 'India'
        },
        location: null,
        description: 'Modern luxury studio apartments.',
        amenities: ['Gym', 'Pool', 'Elevator', 'Security'],
        totalUnits: 402,
        occupiedUnits: 0,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'Sai Enclave',
        type: 'house',
        address: {
          line1: 'Gandhi Nagar, Near CMC Hospital',
          line2: null,
          city: 'Vellore',
          state: 'Tamil Nadu',
          postalCode: '632006',
          country: 'India'
        },
        location: null,
        description: 'Cozy standalone residential house.',
        amenities: ['Garden', 'Power Backup'],
        totalUnits: 65,
        occupiedUnits: 65,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'BlueStone Heights',
        type: 'apartment',
        address: {
          line1: 'Madhapur IT Park Road',
          line2: null,
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'India'
        },
        location: null,
        description: 'Premium flat block in the heart of tech corridor.',
        amenities: ['High-speed Wifi', 'Gym', 'Clubhouse'],
        totalUnits: 345,
        occupiedUnits: 0,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'Green Valley Homes',
        type: 'mixed',
        address: {
          line1: '45, RS Puram, Near Bus Stand',
          line2: null,
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          postalCode: '641002',
          country: 'India'
        },
        location: null,
        description: 'Beautiful gated villa community.',
        amenities: ['Park', 'Security', 'Water Harvesting'],
        totalUnits: 234,
        occupiedUnits: 234,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'Sunrise Residency',
        type: 'apartment',
        address: {
          line1: '12, Anna Nagar Main Road, Near VR Mall',
          line2: null,
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '600040',
          country: 'India'
        },
        location: null,
        description: 'Spacious flats with excellent connectivity.',
        amenities: ['Balcony', 'Lift', 'Parking'],
        totalUnits: 204,
        occupiedUnits: 0,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'Oakwood Manor',
        type: 'house',
        address: {
          line1: 'Unit 3, MG Road',
          line2: null,
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India'
        },
        location: null,
        description: 'Elegant colonial-style manor.',
        amenities: ['Fireplace', 'Garden'],
        totalUnits: 3,
        occupiedUnits: 0,
        status: 'active',
        images: []
      },
      {
        ownerId: 'usr_demo',
        name: 'Silicon Towers',
        type: 'commercial',
        address: {
          line1: '9th Floor, Tech Park',
          line2: null,
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560048',
          country: 'India'
        },
        location: null,
        description: 'Corporate office suites.',
        amenities: ['Meeting Rooms', 'Fiber Internet', 'Cafe'],
        totalUnits: 15,
        occupiedUnits: 0,
        status: 'active',
        images: []
      }
    ]

    for (const item of seedData) {
      const id = randomUUID()
      this.properties.set(id, {
        ...item,
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      })
    }
    this.save()
  }

  private save() {
    persistentDb.saveProperties(this.properties)
  }

  async findById(id: string): Promise<PropertyRecord | null> {
    const record = this.properties.get(id)
    return record && !record.deletedAt ? record : null
  }

  async findByOwner(ownerId: string, filter: PropertyFilter): Promise<PropertyListResult> {
    let items = Array.from(this.properties.values()).filter(
      (p) => (p.ownerId === ownerId || p.ownerId === 'usr_demo') && !p.deletedAt,
    )
    items = this.applyFilters(items, filter)
    items = this.applySort(items, filter)
    const total = items.length
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) {
      items = items.filter((p) => new Date(p.createdAt) < cursor)
    }
    const slice = items.slice(0, limit + 1)
    const nextCursor = slice.length > limit ? slice[limit].createdAt : null
    return { items: slice.slice(0, limit), nextCursor, total }
  }

  async findAll(filter: PropertyFilter): Promise<PropertyListResult> {
    let items = Array.from(this.properties.values()).filter((p) => !p.deletedAt)
    items = this.applyFilters(items, filter)
    items = this.applySort(items, filter)
    const total = items.length
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) {
      items = items.filter((p) => new Date(p.createdAt) < cursor)
    }
    const slice = items.slice(0, limit + 1)
    const nextCursor = slice.length > limit ? slice[limit].createdAt : null
    return { items: slice.slice(0, limit), nextCursor, total }
  }

  async create(input: CreatePropertyInput): Promise<PropertyRecord> {
    const now = new Date().toISOString()
    const record: PropertyRecord = {
      id: randomUUID(),
      ownerId: input.ownerId,
      name: input.name,
      type: input.type,
      address: {
        line1: input.address.line1,
        line2: input.address.line2 ?? null,
        city: input.address.city,
        state: input.address.state,
        postalCode: input.address.postalCode,
        country: input.address.country,
      },
      location: input.location ?? null,
      description: input.description ?? null,
      amenities: input.amenities ?? [],
      totalUnits: input.totalUnits ?? 0,
      occupiedUnits: input.occupiedUnits ?? 0,
      status: 'active',
      listingStatus: input.listingStatus && input.listingStatus !== 'inactive' ? input.listingStatus : 'for-rent',
      bedrooms: input.bedrooms ?? 0,
      bathrooms: input.bathrooms ?? 0,
      parking: input.parking ?? 0,
      areaSqFt: input.areaSqFt ?? 0,
      monthlyRent: input.monthlyRent ?? 0,
      securityDeposit: input.securityDeposit ?? 0,
      salePrice: input.salePrice ?? 0,
      imageUrl: input.imageUrl ?? '',
      ownerEmail: input.ownerEmail ?? '',
      images: input.images && input.images.length > 0 ? input.images : (input.imageUrl ? [input.imageUrl] : []),
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    this.properties.set(record.id, record)
    this.save()
    return record
  }

  async update(id: string, input: UpdatePropertyInput): Promise<PropertyRecord | null> {
    const existing = this.properties.get(id)
    if (!existing || existing.deletedAt) return null
    const updated: PropertyRecord = {
      ...existing,
      ...input,
      address: input.address
        ? {
            ...existing.address,
            ...input.address,
            line2: input.address.line2 ?? existing.address.line2,
          }
        : existing.address,
      updatedAt: new Date().toISOString(),
    }
    this.properties.set(id, updated)
    this.save()
    return updated
  }

  async softDelete(id: string): Promise<PropertyRecord | null> {
    const existing = this.properties.get(id)
    if (!existing || existing.deletedAt) return null
    const updated: PropertyRecord = { ...existing, deletedAt: new Date().toISOString() }
    this.properties.set(id, updated)
    this.save()
    return updated
  }

  async restore(id: string): Promise<PropertyRecord | null> {
    const existing = this.properties.get(id)
    if (!existing) return null
    const { deletedAt: _deletedAt, ...rest } = existing
    const updated: PropertyRecord = { ...rest, deletedAt: null, updatedAt: new Date().toISOString() }
    this.properties.set(id, updated)
    this.save()
    return updated
  }

  async findAllPublished(filter: PropertyFilter): Promise<PropertyListResult> {
    let items = Array.from(this.properties.values()).filter(
      (p) =>
        p.status === 'active' &&
        !p.deletedAt &&
        (p.listingStatus === 'for-rent' || p.listingStatus === 'for-sale') &&
        (p.totalUnits <= 0 || p.occupiedUnits < p.totalUnits),
    )
    items = this.applyFilters(items, filter)
    items = this.applySort(items, filter)
    const total = items.length
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) {
      items = items.filter((p) => new Date(p.createdAt) < cursor)
    }
    const slice = items.slice(0, limit + 1)
    const nextCursor = slice.length > limit ? slice[limit].createdAt : null
    return { items: slice.slice(0, limit), nextCursor, total }
  }

  async search(query: string, filter: PropertyFilter): Promise<PropertyListResult> {
    const q = query.toLowerCase()
    let items = Array.from(this.properties.values()).filter(
      (p) =>
        p.status === 'active' &&
        !p.deletedAt &&
        (p.listingStatus === 'for-rent' || p.listingStatus === 'for-sale') &&
        (p.totalUnits <= 0 || p.occupiedUnits < p.totalUnits) &&
        (p.name.toLowerCase().includes(q) ||
          p.address.city.toLowerCase().includes(q) ||
          p.address.state.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)),
    )
    items = this.applyFilters(items, filter)
    items = this.applySort(items, filter)
    const total = items.length
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) {
      items = items.filter((p) => new Date(p.createdAt) < cursor)
    }
    const slice = items.slice(0, limit + 1)
    const nextCursor = slice.length > limit ? slice[limit].createdAt : null
    return { items: slice.slice(0, limit), nextCursor, total }
  }

  private applyFilters(items: PropertyRecord[], filter: PropertyFilter): PropertyRecord[] {
    if (filter.type) items = items.filter((p) => p.type === filter.type)
    if (filter.status) items = items.filter((p) => p.status === filter.status)
    if (filter.city) items = items.filter((p) => p.address.city.toLowerCase() === filter.city!.toLowerCase())
    if (filter.state) items = items.filter((p) => p.address.state.toLowerCase() === filter.state!.toLowerCase())
    return items
  }

  private applySort(items: PropertyRecord[], filter: PropertyFilter): PropertyRecord[] {
    const field = filter.sort ?? 'createdAt'
    const order = filter.order ?? 'desc'

    const sortedItems = items.slice()

    sortedItems.sort((a, b) => {
      const getAVal = () => {
        switch (field) {
          case 'id': return a.id
          case 'ownerId': return a.ownerId
          case 'name': return a.name
          case 'type': return a.type
          case 'description': return a.description ?? ''
          case 'totalUnits': return a.totalUnits
          case 'occupiedUnits': return a.occupiedUnits
          case 'status': return a.status
          default: return a.createdAt
        }
      }

      const getBVal = () => {
        switch (field) {
          case 'id': return b.id
          case 'ownerId': return b.ownerId
          case 'name': return b.name
          case 'type': return b.type
          case 'description': return b.description ?? ''
          case 'totalUnits': return b.totalUnits
          case 'occupiedUnits': return b.occupiedUnits
          case 'status': return b.status
          default: return b.createdAt
        }
      }

      const aVal = getAVal()
      const bVal = getBVal()

      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })

    return sortedItems
  }

  async listAllProperties(): Promise<PropertyRecord[]> {
    return Array.from(this.properties.values())
      .filter((p) => !p.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}

