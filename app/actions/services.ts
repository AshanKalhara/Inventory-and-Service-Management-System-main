'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { services, customers, bikes, serviceRecords, serviceRecordItems, parts } from '@/lib/db/schema'
import { and, desc, eq, ilike } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getServices() {
  const userId = await getUserId()
  return db
    .select()
    .from(services)
    .where(eq(services.userId, userId))
    .orderBy(desc(services.createdAt))
}

//--------- Create Service ----

export async function createService(data: {
  name: string
  description?: string
  price: number
  estimatedDuration?: number
  category: string
}) {
  const userId = await getUserId()
  const result = await db
    .insert(services)
    .values({
      userId,
      name: data.name,
      description: data.description,
      price: data.price.toString(),
      estimatedDuration: data.estimatedDuration,
      category: data.category,
    })
    .returning()
  revalidatePath('/services')
  return result[0]
}

export async function getBikeServiceHistory(registrationNumber: string) {
  try {
    const cleanRegNo = decodeURIComponent(registrationNumber.trim());

    const bikeData = await db.query.bikes.findFirst({
      where: ilike(bikes.registrationNumber, cleanRegNo),
      with: {
        serviceRecords: {
          orderBy: (records, { desc }) => [desc(records.serviceDate)],
        },
      },
    });

    if (!bikeData) return null;

    const mappedRecords = (bikeData.serviceRecords || []).map((record) => ({
      id: record.id,
      registrationNumber: record.registrationNumber,
      serviceDate: record.serviceDate
        ? new Date(record.serviceDate).toISOString()
        : new Date(record.createdAt).toISOString(),
      description: record.description,
      price: record.cost ? String(record.cost) : null,
      milageOnService: record.milageOnService,
      status: record.status,
    }));

    return {
      ...bikeData,
      serviceRecords: mappedRecords,
    };
  } catch (error) {
    console.error("Error fetching bike service history:", error);
    return null;
  }
}

export type BikeServiceHistoryResult = Awaited<ReturnType<typeof getBikeServiceHistory>>;

export async function updateService(
  serviceId: number,
  data: {
    name?: string
    description?: string
    price?: number
    estimatedDuration?: number
    category?: string
    active?: boolean
  }
) {
  const userId = await getUserId()
  const result = await db
    .update(services)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price.toString() }),
      ...(data.estimatedDuration !== undefined && { estimatedDuration: data.estimatedDuration }),
      ...(data.category && { category: data.category }),
      ...(data.active !== undefined && { active: data.active }),
    })
    .where(and(eq(services.id, serviceId), eq(services.userId, userId)))
    .returning()
    
  revalidatePath('/services')
  return result[0]
}

export async function deleteService(serviceId: number) {
  const userId = await getUserId()
  await db
    .delete(services)
    .where(and(eq(services.id, serviceId), eq(services.userId, userId)))
    
  revalidatePath('/services')
}

// Service Record CRUD
export async function getServiceRecords() {
  const userId = await getUserId()
  return db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.userId, userId))
    .orderBy(desc(serviceRecords.serviceDate))
}

export async function createServiceRecord(data: {
  customerId: number
  registrationNumber: string
  serviceDate: Date
  milageOnService: string
  description?: string
  technician?: string
  notes?: string
  cost?: number
}) {
  const userId = await getUserId()

  const result = await db
    .insert(serviceRecords)
    .values({
      userId,
      registrationNumber: data.registrationNumber,
      serviceDate: data.serviceDate,
      milageOnService: data.milageOnService,
      description: data.description ?? null,
      technician: data.technician ?? null,
      notes: data.notes ?? null,
      cost: data.cost !== undefined ? data.cost.toString() : null,
      status: 'pending',
    })
    .returning()

  await syncBikeMileage(data.registrationNumber)

  revalidatePath('/services')
  revalidatePath('/customers')
  return result[0]
}

export async function updateServiceRecord(
  recordId: number,
  data: {
    status?: string
    description?: string
    technician?: string
    cost?: number
    notes?: string
    completionDate?: Date
    serviceDate?: Date
    milageOnService?: string
  }
) {
  const userId = await getUserId()
  const updateData: any = {}
  
  if (data.status) updateData.status = data.status
  if (data.description !== undefined) updateData.description = data.description
  if (data.technician !== undefined) updateData.technician = data.technician
  if (data.cost !== undefined) updateData.cost = data.cost.toString()
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.completionDate) updateData.completionDate = data.completionDate
  if (data.serviceDate) updateData.serviceDate = data.serviceDate
  if (data.milageOnService !== undefined) updateData.milageOnService = data.milageOnService
  
  updateData.updatedAt = new Date()

  const result = await db
    .update(serviceRecords)
    .set(updateData)
    .where(and(eq(serviceRecords.id, recordId), eq(serviceRecords.userId, userId)))
    .returning()

  if (result[0]) {
    await syncBikeMileage(result[0].registrationNumber)
  }

  revalidatePath('/services')
  revalidatePath('/customers')
  return result[0]
}

export async function deleteServiceRecord(recordId: number) {
  const userId = await getUserId()
  await db
    .delete(serviceRecords)
    .where(and(eq(serviceRecords.id, recordId), eq(serviceRecords.userId, userId)))
  revalidatePath('/services')
}

// Service Record Items
export async function createServiceRecordItem(data: {
  serviceRecordId: number
  serviceId?: number | null
  partId?: number | null
  description: string
  quantity: number
  unitPrice: number
  discount?: number
  totalPrice: number
}) {
  const userId = await getUserId()
  
  // Deduct inventory if partId is provided
  if (data.partId) {
    const part = await db.select().from(parts).where(eq(parts.id, data.partId)).limit(1)
    if (part.length > 0) {
      const currentQuantity = parseInt(part[0].quantity.toString())
      const newQuantity = Math.max(0, currentQuantity - data.quantity)
      await db
        .update(parts)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(parts.id, data.partId))
    }
  }
  
  const valueObj: any = {
    serviceRecordId: data.serviceRecordId,
    description: data.description,
    quantity: data.quantity,
    unitPrice: data.unitPrice.toString(),
    totalPrice: data.totalPrice.toString(),
  }
  
  if (data.serviceId) valueObj.serviceId = data.serviceId
  if (data.partId) valueObj.partId = data.partId
  
  const result = await db
    .insert(serviceRecordItems)
    .values(valueObj)
    .returning()
  revalidatePath('/services')
  revalidatePath('/inventory')
  return result[0]
}

export async function deleteServiceRecordItem(itemId: number) {
  const userId = await getUserId()
  
  // Get the item to retrieve partId and quantity
  const item = await db
    .select()
    .from(serviceRecordItems)
    .where(eq(serviceRecordItems.id, itemId))
    .limit(1)
  
  // Restore inventory if partId exists
  if (item.length > 0 && item[0].partId) {
    const part = await db.select().from(parts).where(eq(parts.id, item[0].partId)).limit(1)
    if (part.length > 0) {
      const currentQuantity = parseInt(part[0].quantity.toString())
      const itemQuantity = item[0].quantity || 0
      const newQuantity = currentQuantity + itemQuantity
      await db
        .update(parts)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(parts.id, item[0].partId))
    }
  }
  
  await db
    .delete(serviceRecordItems)
    .where(eq(serviceRecordItems.id, itemId))
  revalidatePath('/services')
  revalidatePath('/inventory')
}

async function syncBikeMileage(registrationNumber: string) {

  const latestRecord = await db.query.serviceRecords.findFirst({
    where: eq(serviceRecords.registrationNumber, registrationNumber),
    orderBy: (records, { desc }) => [desc(records.serviceDate)],
  });

  if (latestRecord && latestRecord.milageOnService) {
    await db
      .update(bikes)
      .set({ mileage: latestRecord.milageOnService, updatedAt: new Date() })
      .where(eq(bikes.registrationNumber, registrationNumber));
  }
}
export async function getServiceRecordItemsByRecord(serviceRecordId: number) {
  const userId = await getUserId()
  return db
    .select()
    .from(serviceRecordItems)
    .where(eq(serviceRecordItems.serviceRecordId, serviceRecordId))
}