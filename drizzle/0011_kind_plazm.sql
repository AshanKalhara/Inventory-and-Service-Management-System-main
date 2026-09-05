ALTER TABLE "bikes" ADD COLUMN "registration_number" varchar(10) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "bikes" DROP COLUMN "id";