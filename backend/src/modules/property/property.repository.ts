import type {
  PropertyRecord,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilter,
  PropertyListResult,
} from './property.types.js'

export interface PropertyRepository {
  findById(id: string): Promise<PropertyRecord | null>
  findByOwner(ownerId: string, filter: PropertyFilter): Promise<PropertyListResult>
  create(input: CreatePropertyInput): Promise<PropertyRecord>
  update(id: string, input: UpdatePropertyInput): Promise<PropertyRecord | null>
  softDelete(id: string): Promise<PropertyRecord | null>
  restore(id: string): Promise<PropertyRecord | null>
  findAllPublished(filter: PropertyFilter): Promise<PropertyListResult>
  search(query: string, filter: PropertyFilter): Promise<PropertyListResult>
}
