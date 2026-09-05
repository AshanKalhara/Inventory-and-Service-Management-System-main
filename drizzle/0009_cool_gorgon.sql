ALTER TABLE "parts" ADD COLUMN "minStock" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "unitPrice" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "min_stock";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "unit_price";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "updated_at";