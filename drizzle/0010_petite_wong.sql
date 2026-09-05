ALTER TABLE "invoices" DROP CONSTRAINT "invoices_invoiceNumber_unique";--> statement-breakpoint
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_partId_parts_id_fk";
--> statement-breakpoint
ALTER TABLE "bikes" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bikes" ADD COLUMN "customer_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "bikes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "bikes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "invoice_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "unit_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "total_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "service_record_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_date" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "min_stock" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "unit_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "part_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "quantity_bought" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "purchase_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "service_record_items" ADD COLUMN "service_record_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "service_record_items" ADD COLUMN "service_id" integer;--> statement-breakpoint
ALTER TABLE "service_record_items" ADD COLUMN "part_id" integer;--> statement-breakpoint
ALTER TABLE "service_record_items" ADD COLUMN "unit_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_record_items" ADD COLUMN "total_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_record_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "customer_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "bike_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "service_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "total_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "completion_date" timestamp;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "estimated_duration" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bikes" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "bikes" DROP COLUMN "customerId";--> statement-breakpoint
ALTER TABLE "bikes" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "bikes" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "invoice_items" DROP COLUMN "invoiceId";--> statement-breakpoint
ALTER TABLE "invoice_items" DROP COLUMN "unitPrice";--> statement-breakpoint
ALTER TABLE "invoice_items" DROP COLUMN "totalPrice";--> statement-breakpoint
ALTER TABLE "invoice_items" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "customerId";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "serviceRecordId";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "invoiceNumber";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "invoiceDate";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "dueDate";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "paidDate";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "minStock";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "unitPrice";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "partId";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "quantityBought";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "purchasePrice";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "service_record_items" DROP COLUMN "serviceRecordId";--> statement-breakpoint
ALTER TABLE "service_record_items" DROP COLUMN "serviceId";--> statement-breakpoint
ALTER TABLE "service_record_items" DROP COLUMN "partId";--> statement-breakpoint
ALTER TABLE "service_record_items" DROP COLUMN "unitPrice";--> statement-breakpoint
ALTER TABLE "service_record_items" DROP COLUMN "totalPrice";--> statement-breakpoint
ALTER TABLE "service_record_items" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "customerId";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "bikeId";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "serviceDate";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "totalCost";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "completionDate";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "estimatedDuration";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number");