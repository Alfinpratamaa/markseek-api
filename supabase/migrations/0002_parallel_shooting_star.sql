ALTER TABLE "product" ADD COLUMN "createdBy" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;