import { Property, type PropertyDocument } from './models/property.model.js'
import type { PropertyRepository } from './property.repository.js'
import type {
  PropertyRecord,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilter,
  PropertyListResult,
} from './property.types.js'

// Lazy import to avoid circular deps at startup — Tenancy model is registered by the time queries run
async function getActiveTenantPropertyIds(): Promise<string[]> {
  const { Tenancy } = await import('../tenancy/tenancy.model.js')
  const docs = await Tenancy.find(
    { status: { $in: ['active', 'expiring-soon'] } },
    { propertyId: 1, _id: 0 },
  ).lean()
  return docs.map((d: any) => d.propertyId?.toString()).filter(Boolean)
}

function toPropertyRecord(doc: PropertyDocument): PropertyRecord {
  const createdAtStr = doc.createdAt
    ? doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : new Date(doc.createdAt).toISOString()
    : new Date().toISOString()

  const updatedAtStr = doc.updatedAt
    ? doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : new Date(doc.updatedAt).toISOString()
    : new Date().toISOString()

  return {
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    name: doc.name,
    type: doc.type,
    address: {
      line1: doc.address.line1,
      line2: doc.address.line2 ?? null,
      city: doc.address.city,
      state: doc.address.state,
      postalCode: doc.address.postalCode,
      country: doc.address.country,
    },
    location: doc.location
      ? { type: 'Point' as const, coordinates: doc.location.coordinates as [number, number] }
      : null,
    description: doc.description ?? null,
    amenities: doc.amenities ?? [],
    totalUnits: doc.totalUnits ?? 0,
    occupiedUnits: doc.occupiedUnits ?? 0,
    status: doc.status,
    listingStatus: doc.listingStatus,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    parking: doc.parking,
    areaSqFt: doc.areaSqFt,
    monthlyRent: doc.monthlyRent,
    securityDeposit: (doc as any).securityDeposit,
    salePrice: doc.salePrice,
    imageUrl: doc.imageUrl,
    ownerEmail: doc.ownerEmail,
    images: doc.images ?? [],
    deletedAt: doc.deletedAt
      ? doc.deletedAt instanceof Date
        ? doc.deletedAt.toISOString()
        : new Date(doc.deletedAt).toISOString()
      : null,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
  }
}

export class MongoPropertyRepository implements PropertyRepository {
  async create(input: CreatePropertyInput): Promise<PropertyRecord> {
    const payload = {
      ...input,
      listingStatus: input.listingStatus && input.listingStatus !== 'inactive' ? input.listingStatus : 'for-rent',
      images: input.images && input.images.length > 0 ? input.images : (input.imageUrl ? [input.imageUrl] : []),
    }
    const doc = await Property.create(payload)
    return toPropertyRecord(doc as unknown as PropertyDocument)
  }

  async findById(id: string): Promise<PropertyRecord | null> {
    const doc = await Property.findById(id).lean()
    return doc ? toPropertyRecord(doc as PropertyDocument) : null
  }

  async findByOwner(ownerId: string, filter: PropertyFilter): Promise<PropertyListResult> {
    const query: Record<string, unknown> = { ownerId, deletedAt: null }
    this.applyFilters(query, filter)
    const sort = this.buildSort(filter)
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) query.createdAt = { $lt: cursor }

    const [items, total] = await Promise.all([
      Property.find(query).sort(sort).limit(limit + 1).lean(),
      Property.countDocuments(query),
    ])

    const records = (items as PropertyDocument[]).map(toPropertyRecord)
    const nextCursor = records.length > limit ? records[limit].createdAt.toString() : null
    return { items: records.slice(0, limit), nextCursor, total }
  }

  async update(id: string, input: UpdatePropertyInput): Promise<PropertyRecord | null> {
    const doc = await Property.findByIdAndUpdate(
      id,
      { $set: input, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean()
    return doc ? toPropertyRecord(doc as PropertyDocument) : null
  }

  async softDelete(id: string): Promise<PropertyRecord | null> {
    const doc = await Property.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true },
    ).lean()
    return doc ? toPropertyRecord(doc as PropertyDocument) : null
  }

  async restore(id: string): Promise<PropertyRecord | null> {
    const doc = await Property.findByIdAndUpdate(
      id,
      { $unset: { deletedAt: 1 } },
      { new: true },
    ).lean()
    return doc ? toPropertyRecord(doc as PropertyDocument) : null
  }

  async findAllPublished(filter: PropertyFilter): Promise<PropertyListResult> {
    // Get property IDs that currently have active tenancies — these must NEVER appear as available
    const occupiedByTenancy = await getActiveTenantPropertyIds()

    const query: Record<string, unknown> = {
      status: 'active',
      deletedAt: null,
      listingStatus: { $in: ['for-rent', 'for-sale'] },
    }

    // Exclude properties with active tenancies from marketplace listings
    if (occupiedByTenancy.length > 0) {
      query._id = { $nin: occupiedByTenancy }
    }

    this.applyFilters(query, filter)
    const sort = this.buildSort(filter)
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) query.createdAt = { $lt: cursor }

    const [items, total] = await Promise.all([
      Property.find(query).sort(sort).limit(limit + 1).lean(),
      Property.countDocuments(query),
    ])

    const records = (items as PropertyDocument[]).map(toPropertyRecord)
    const nextCursor = records.length > limit ? records[limit].createdAt.toString() : null
    return { items: records.slice(0, limit), nextCursor, total }
  }

  async findAll(filter: PropertyFilter): Promise<PropertyListResult> {
    const query: Record<string, unknown> = { deletedAt: null }

    this.applyFilters(query, filter)
    const sort = this.buildSort(filter)
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) query.createdAt = { $lt: cursor }

    const [items, total] = await Promise.all([
      Property.find(query).sort(sort).limit(limit + 1).lean(),
      Property.countDocuments(query),
    ])

    const records = (items as PropertyDocument[]).map(toPropertyRecord)
    const nextCursor = records.length > limit ? records[limit].createdAt.toString() : null
    return { items: records.slice(0, limit), nextCursor, total }
  }

  async search(query: string, filter: PropertyFilter): Promise<PropertyListResult> {
    // Get property IDs that currently have active tenancies
    const occupiedByTenancy = await getActiveTenantPropertyIds()

    const q: Record<string, unknown> = {
      $text: { $search: query },
      status: 'active',
      deletedAt: null,
      listingStatus: { $in: ['for-rent', 'for-sale'] },
    }

    if (occupiedByTenancy.length > 0) {
      q._id = { $nin: occupiedByTenancy }
    }

    const sort = filter.sort === 'relevance' ? { score: { $meta: 'textScore' } } : this.buildSort(filter)
    const limit = Math.min(filter.limit ?? 20, 100)
    const cursor = filter.cursor ? new Date(filter.cursor) : undefined
    if (cursor && !isNaN(cursor.getTime())) q.createdAt = { $lt: cursor }

    const [items, total] = await Promise.all([
      Property.find(q as Record<string, unknown>)
        .sort(sort)
        .limit(limit + 1)
        .lean(),
      Property.countDocuments(q as Record<string, unknown>),
    ])

    const records = (items as PropertyDocument[]).map(toPropertyRecord)
    const nextCursor = records.length > limit ? records[limit].createdAt.toString() : null
    return { items: records.slice(0, limit), nextCursor, total }
  }

  async listAllProperties(): Promise<PropertyRecord[]> {
    const docs = await Property.find({ deletedAt: null }).sort({ createdAt: -1 }).lean()
    return docs.map(toPropertyRecord)
  }

  private applyFilters(query: Record<string, unknown>, filter: PropertyFilter): void {
    if (filter.type) query.type = filter.type
    if (filter.status) query.status = filter.status
    if (filter.city) query['address.city'] = filter.city
    if (filter.state) query['address.state'] = filter.state
    if (filter.ownerId) query.ownerId = filter.ownerId
  }

  private buildSort(filter: PropertyFilter): Record<string, 1 | -1> {
    const field = filter.sort ?? 'createdAt'
    const order = filter.order ?? 'desc'
    return { [field]: order === 'asc' ? 1 : -1 }
  }
}
