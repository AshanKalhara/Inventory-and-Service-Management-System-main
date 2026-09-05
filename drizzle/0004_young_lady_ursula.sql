CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"partId" integer NOT NULL,
	"supplier" text,
	"quantityBought" integer NOT NULL,
	"purchasePrice" numeric(10, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_partId_parts_id_fk" FOREIGN KEY ("partId") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;