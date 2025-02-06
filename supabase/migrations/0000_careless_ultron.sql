CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"sessionCartId" text NOT NULL,
	"items" json DEFAULT '[]'::json NOT NULL,
	"itemsPrice" numeric(12, 2) NOT NULL,
	"shippingPrice" numeric(12, 2) NOT NULL,
	"taxPrice" numeric(12, 2) NOT NULL,
	"totalPrice" numeric(12, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"orderId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"qty" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image" text NOT NULL,
	CONSTRAINT "orderItems_orderId_productId_pk" PRIMARY KEY("orderId","productId")
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"shippingAddress" json NOT NULL,
	"paymentMethod" text NOT NULL,
	"paymentResult" json,
	"itemsPrice" numeric(12, 2) NOT NULL,
	"shippingPrice" numeric(12, 2) NOT NULL,
	"taxPrice" numeric(12, 2) NOT NULL,
	"totalPrice" numeric(12, 2) NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"paidAt" timestamp,
	"isDelivered" boolean DEFAULT false NOT NULL,
	"deliveredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"images" text[] NOT NULL,
	"brand" text NOT NULL,
	"description" text NOT NULL,
	"stock" integer NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"numReviews" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"banner" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"isVerifiedPurchase" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'NO_NAME' NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"password" text,
	"emailVerified" timestamp,
	"avatar" text,
	"address" json,
	"paymentMethod" text,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_idx" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");