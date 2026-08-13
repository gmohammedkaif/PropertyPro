import { getPropertyRepository } from './repository.js'
import type {
  PropertyRecord,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilter,
  PropertyListResult,
} from './property.types.js'
import { NotFoundError } from '../../core/errors.js'
import { logger } from '../../core/logger.js'

class PropertyService {
  private get repository() {
    return getPropertyRepository()
  }

  async findById(id: string): Promise<PropertyRecord> {
    const property = await this.repository.findById(id)
    if (!property) throw new NotFoundError('Property not found')
    return property
  }

  async findByOwner(ownerId: string, filter: PropertyFilter): Promise<PropertyListResult> {
    return this.repository.findByOwner(ownerId, filter)
  }

  async create(input: CreatePropertyInput): Promise<PropertyRecord> {
    const property = await this.repository.create(input)
    logger.info({ propertyId: property.id, ownerId: input.ownerId }, 'Property created')
    return property
  }

  async update(id: string, input: UpdatePropertyInput): Promise<PropertyRecord> {
    const property = await this.repository.update(id, input)
    if (!property) throw new NotFoundError('Property not found')
    logger.info({ propertyId: id }, 'Property updated')
    return property
  }

  async delete(id: string): Promise<PropertyRecord> {
    const property = await this.repository.softDelete(id)
    if (!property) throw new NotFoundError('Property not found')
    logger.info({ propertyId: id }, 'Property soft-deleted')
    return property
  }

  async restore(id: string): Promise<PropertyRecord> {
    const property = await this.repository.restore(id)
    if (!property) throw new NotFoundError('Property not found')
    logger.info({ propertyId: id }, 'Property restored')
    return property
  }

  async listPublished(filter: PropertyFilter): Promise<PropertyListResult> {
    return this.repository.findAllPublished(filter)
  }

  async findAll(filter: PropertyFilter): Promise<PropertyListResult> {
    return this.repository.findAll(filter)
  }

  async search(query: string, filter: PropertyFilter): Promise<PropertyListResult> {
    return this.repository.search(query, filter)
  }
}

export const propertyService = new PropertyService()