ALTER TABLE "product" DROP CONSTRAINT "product_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "product_createdBy_user_id_fk";
--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "images" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "brand" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "price" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "rating" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "rating" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "rating" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "banner" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "category_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "num_reviews" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "categoryId";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "numReviews";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "isFeatured";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "createdBy";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "createdAt";