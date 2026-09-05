import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  decimal,
  integer,
  varchar,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// --- Better Auth required tables -------------------------------------------

//--- Users Table ----
//--------------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

//--- Session Table ----
//----------------------
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// ---- Account Table ---
//-----------------------
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// --- Verification Table ---
//---------------------------
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- Bike Service Management Tables ----------------------------------------

// ---- Customer's Table ---
//--------------------------
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---- Bikes' Table ---
//----------------------
export const bikes = pgTable('bikes', {
    registrationNumber: varchar('registration_number', { length: 10 }).primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // ✅ Points to user.id (text)
    customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }), // ✅ Added missing customerId (integer)
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    year: text('year'),
    mileage: text('mileage').notNull().default('0'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  // -- Validate the plate number ----
  (table) => [
    check(
      'valid_sri_lankan_plate',
      sql`${table.registrationNumber} ~* '^[A-Z]{1,3}-[0-9]{4}$|^[0-9]{2,3}-[0-9]{4}$|^[A-Z]{2}\\s[A-Z]{2,3}-[0-9]{4}$'`
    ),
  ]
)

// ---- Parts' Table ---
//----------------------
export const parts = pgTable('parts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  category: text('category').notNull(),
  quantity: integer('quantity').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  supplier: text('supplier'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---- Purchases' Table ---
//--------------------------
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  partId: integer('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  supplier: text('supplier'),
  quantityBought: integer('quantity_bought').notNull(),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

//---- Services' Table ----
//-------------------------
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  estimatedDuration: integer('estimated_duration'),
  category: text('category').notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

//--- Service Records' Table --
//-----------------------------
export const serviceRecords = pgTable('service_records', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  registrationNumber: varchar('registration_number', { length: 10 }).notNull().references(() => bikes.registrationNumber, { onDelete: 'cascade' }),
  serviceDate: timestamp('service_date').notNull(),
  milageOnService: text('milage_on_service').notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  description: text('description'),
  technician: text('technician'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---- Service Record Item Table ----
//------------------------------------
export const serviceRecordItems = pgTable('service_record_items', {
  id: serial('id').primaryKey(),
  serviceRecordId: integer('service_record_id').notNull().references(() => serviceRecords.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'set null' }),
  partId: integer('part_id').references(() => parts.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

//--- Inovices' Table ---
//--------------------
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  serviceRecordId: integer('service_record_id').notNull().references(() => serviceRecords.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  invoiceDate: timestamp('invoice_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  paidDate: timestamp('paid_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

//---- Inovoice Items' Table ----
//-------------------------------
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  itemType: varchar('item_type', { length: 20 }).notNull().default('service'), // ✅ add this line
  quantity: integer('quantity').default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
//----- Relations ---
//-------------------

//---- Parts > Purchases -----
export const partsRelations = relations(parts, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  part: one(parts, {
    fields: [purchases.partId],
    references: [parts.id],
  }),
}));

//---- Customer > Bikes ----
export const customersRelations = relations(customers, ({ many }) => ({
  bikes: many(bikes),
}));

export const bikesRelations = relations(bikes, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bikes.customerId],
    references: [customers.id],
  }),
  serviceRecords: many(serviceRecords),
}));

//--- Service Records > Bikes ---
export const serviceRecordRelations = relations(serviceRecords,({ one }) => ({
  bike : one(bikes,{
    fields : [serviceRecords.registrationNumber],
    references : [bikes.registrationNumber]
  }),
}));


