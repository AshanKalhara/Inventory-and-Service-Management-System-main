'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customers, bikes } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Customers
export async function getCustomers() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .orderBy(desc(customers.createdAt))
  return JSON.parse(JSON.stringify(result))
}

export async function createCustomer(data: {
  name: string
  email?: string
  phone?: string
  address?: string
}) {
  const userId = await getUserId()
  const result = await db
    .insert(customers)
    .values({
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    })
    .returning()
  revalidatePath('/customers')
  return result[0]
}

export async function updateCustomer(
  customerId: number,
  data: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
) {
  const userId = await getUserId()
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.address !== undefined) updateData.address = data.address
  updateData.updatedAt = new Date()

  const result = await db
    .update(customers)
    .set(updateData)
    .where(and(eq(customers.id, customerId), eq(customers.userId, userId)))
    .returning()
  revalidatePath('/customers')
  return result[0]
}

export async function deleteCustomer(customerId: number) {
  const userId = await getUserId()
  await db
    .delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.userId, userId)))
  revalidatePath('/customers')
}

// Bikes 

export async function getBikes() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(bikes)
    .where(eq(bikes.userId, userId))
    .orderBy(desc(bikes.createdAt))
  return JSON.parse(JSON.stringify(result))
}

export async function getCustomerBikes(customerId: number) {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(bikes)
    .where(and(eq(bikes.userId, userId), eq(bikes.customerId, customerId)))
    .orderBy(desc(bikes.createdAt))
}

const plateRegex = /^[A-Z]{1,3}-[0-9]{4}$|^[0-9]{2,3}-[0-9]{4}$|^[A-Z]{2}\s[A-Z]{2,3}-[0-9]{4}$/i

const createBikeSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, 'Registration number is required')
    .regex(plateRegex, 'Invalid license plate format (e.g., CAB-1234, WP CAB-1234, or 18-1234)'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  customerId: z.number(),
  year: z.string().optional(),
  mileage: z.string().optional(),
  imageUrl: z.string().optional()
})

export async function createBike(data: {
  customerId: number
  brand: string
  model: string
  year?: string
  mileage?: string
  registrationNumber: string
  notes?: string
}) {
  const validation = createBikeSchema.safeParse(data)

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message
    return { success: false, error: firstError }
  }

  try {
    const userId = await getUserId()
    const { registrationNumber, customerId, brand, model, year, mileage } = validation.data

    await db.insert(bikes).values({
      userId,
      registrationNumber,
      customerId,
      brand,
      model,
      year: year || null,
      mileage: mileage || '0',
    })

    revalidatePath('/customers')
    return { success: true, error: null }
  } catch (error: any) {
    if (error?.code === '23505') {
      return { success: false, error: 'A bike with this registration number already exists.' }
    }
    
    if (error?.code === '23514') {
      return { success: false, error: 'Invalid registration number format.' }
    }

    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

export async function updateBike(
  registrationNumber: string,
  data: {
    brand?: string
    model?: string
    year?: string 
    mileage?: string
  }
) {
  const userId = await getUserId()
  const updateData: any = {}
  if (data.brand) updateData.brand = data.brand
  if (data.model) updateData.model = data.model
  if (data.year !== undefined) updateData.year = data.year
  if (data.mileage !== undefined) updateData.mileage = data.mileage

  updateData.updatedAt = new Date()

  const result = await db
    .update(bikes)
    .set(updateData)
    .where(and(eq(bikes.registrationNumber, registrationNumber), eq(bikes.userId, userId)))
    .returning()
  revalidatePath('/customers')
  return result[0]
}

export async function deleteBike(registrationNumber: string) {
  const userId = await getUserId()
  await db
    .delete(bikes)
    .where(and(eq(bikes.registrationNumber, registrationNumber), eq(bikes.userId, userId)))
  revalidatePath('/customers')
}