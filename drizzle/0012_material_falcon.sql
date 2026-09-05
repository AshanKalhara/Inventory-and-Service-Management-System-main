ALTER TABLE "service_records" ADD COLUMN "registration_number" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_records" DROP COLUMN "bike_id";--> statement-breakpoint
ALTER TABLE "bikes" ADD CONSTRAINT "valid_sri_lankan_plate" CHECK ("bikes"."registration_number" ~* '^[A-Z]{1,3}-[0-9]{4}$|^[0-9]{2,3}-[0-9]{4}$|^[A-Z]{2}\s[A-Z]{2,3}-[0-9]{4}$');