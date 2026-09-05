'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parts, purchases } from '@/lib/db/schema'
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getParts() {
  const userId = await getUserId()
  return db
    .select()
    .from(parts)
    .where(eq(parts.userId, userId))
    .orderBy(desc(parts.createdAt))
}

export async function getLowStockParts() {
  const userId = await getUserId()
  return db
    .select()
    .from(parts)
    .where(and(eq(parts.userId, userId), lt(parts.quantity, parts.minStock)))
    .orderBy(desc(parts.createdAt))
}

export async function createPart(data: {
  name: string
  sku: string
  category: string
  quantity: number
  minStock: number
  unitPrice: number
  supplier?: string | null
  notes?: string | null
}) {
  const userId = await getUserId()


  const cleanSupplier = data.supplier && data.supplier !== 'None' ? data.supplier : null
  const cleanNotes = data.notes && data.notes !== 'None' ? data.notes : null

  return await db.transaction(async (tx) => {
 
    const [existingPart] = await tx
      .select()
      .from(parts)
      .where(and(eq(parts.sku, data.sku), eq(parts.userId, userId)))
      .limit(1)

    let targetPart: typeof parts.$inferSelect

    if (existingPart) {

      const [updated] = await tx
        .update(parts)
        .set({
          quantity: sql`${parts.quantity} + ${data.quantity}`,
          unitPrice: data.unitPrice.toString(),
          supplier: cleanSupplier ?? existingPart.supplier,
          notes: cleanNotes ?? existingPart.notes,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, existingPart.id))
        .returning()

      targetPart = updated
    } else {
 
      const [inserted] = await tx
        .insert(parts)
        .values({
          userId,
          name: data.name,
          sku: data.sku,
          category: data.category,
          quantity: data.quantity,
          minStock: data.minStock,
          unitPrice: data.unitPrice.toString(),
          supplier: cleanSupplier,
          notes: cleanNotes,
        })
        .returning()

      targetPart = inserted
    }


    await tx.insert(purchases).values({
      userId,
      partId: targetPart.id,
      supplier: cleanSupplier,
      quantityBought: data.quantity,
      purchasePrice: data.unitPrice.toString(),
    })

    revalidatePath('/inventory')
    return targetPart
  })
}

export async function updatePart(
  partId: number,
  data: {
    name?: string
    quantity?: number
    minStock?: number
    unitPrice?: number
    supplier?: string | null
    notes?: string | null
  }
) {
  const userId = await getUserId()

  const updateData: Partial<typeof parts.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.minStock !== undefined) updateData.minStock = data.minStock
  if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice.toString()
  if (data.supplier !== undefined) {
    updateData.supplier = data.supplier && data.supplier !== 'None' ? data.supplier : null
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes && data.notes !== 'None' ? data.notes : null
  }

  const [result] = await db
    .update(parts)
    .set(updateData)
    .where(and(eq(parts.id, partId), eq(parts.userId, userId)))
    .returning()

  revalidatePath('/inventory')
  return result
}

export async function deletePart(partId: number) {
  const userId = await getUserId()

  await db
    .delete(parts)
    .where(and(eq(parts.id, partId), eq(parts.userId, userId)))

  revalidatePath('/inventory')
  return { success: true }
}