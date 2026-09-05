'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Generate invoice number
function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

// Invoices
export async function getInvoices() {
  const userId = await getUserId()
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.invoiceDate))
}

export async function getInvoiceById(invoiceId: number) {
  const userId = await getUserId()
  const invoiceData = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))

  if (!invoiceData.length) throw new Error('Invoice not found')

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))

  return { ...invoiceData[0], items }
}

export async function createInvoice(data: {
  customerId: number
  serviceRecordId: number
  subtotal: number
  tax: number
  discount?: number
  total: number
  notes?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    itemType?: 'service' | 'part' | 'other'
  }>
}) {
  const userId = await getUserId()
  const invoiceNumber = generateInvoiceNumber()

  const result = await db
    .insert(invoices)
    .values({
      userId,
      customerId: data.customerId,
      serviceRecordId: data.serviceRecordId,
      invoiceNumber,
      subtotal: data.subtotal.toString(),
      tax: data.tax.toString(),
      discount: (data.discount || 0).toString(),
      total: data.total.toString(),
      notes: data.notes,
      status: 'pending',
    })
    .returning()

  const invoiceId = result[0].id

  // Add invoice items
  for (const item of data.items) {
    await db.insert(invoiceItems).values({
      invoiceId,
      description: item.description,
      itemType: item.itemType || 'service',
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
    })
  }

  revalidatePath('/invoices')
  return result[0]
}

export async function updateInvoiceStatus(invoiceId: number, status: string) {
  const userId = await getUserId()
  const updateData: any = {
    status,
    updatedAt: new Date(),
  }
  if (status === 'paid') {
    updateData.paidDate = new Date()
  }

  const result = await db
    .update(invoices)
    .set(updateData)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .returning()
  revalidatePath('/invoices')
  return result[0]
}

export async function deleteInvoice(invoiceId: number) {
  const userId = await getUserId()
  await db
    .delete(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
  await db
    .delete(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
  revalidatePath('/invoices')
}