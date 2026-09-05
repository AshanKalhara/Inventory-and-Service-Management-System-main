ALTER TABLE "service_records" DROP CONSTRAINT "service_records_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "bikes" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "milage_on_service" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" ADD COLUMN "cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bikes" ADD CONSTRAINT "bikes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "total_cost";--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "completion_date";