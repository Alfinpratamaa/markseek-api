import {
  boolean,
  json,
  numeric,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { integer, uniqueIndex } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { CartItem, PaymentResult, ShippingAddress } from "../types";
import { relations } from "drizzle-orm";

export const users = pgTable(
  "user",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").default("NO_NAME").notNull(),
    email: text("email").notNull().unique(),
    role: text("role").notNull().default("user"),
    password: text("password"),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    avatar: text("avatar"),
    address: json("address").$type<ShippingAddress>(),
    products: json("products").$type<string[]>(),
    paymentMethod: text("paymentMethod"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => {
    return {
      userEmailIdx: uniqueIndex("user_email_idx").on(table.email),
    };
  }
);

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    categoryId: text("category_id").notNull(),
    images: text("images").notNull(), // Jika menggunakan JSON, gunakan `json("images")`
    brand: varchar("brand", { length: 255 }).notNull(),
    description: text("description").notNull(),
    stock: integer("stock").notNull(),
    price: integer("price").notNull(),
    rating: integer("rating").default(0), // Tambahkan default value jika perlu
    numReviews: integer("num_reviews").default(0),
    isFeatured: boolean("is_featured").default(false),
    banner: varchar("banner", { length: 255 }), // Bisa null atau opsional
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      productSlugIdx: uniqueIndex("product_slug_idx").on(table.slug),
    };
  }
);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  description: text("slug").notNull(),
  isVerifiedPurchase: boolean("isVerifiedPurchase").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
export const productRelations = relations(products, ({ many }) => ({
  reviews: many(reviews),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

// CARTS
export const carts = pgTable("cart", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  userId: uuid("userId").references(() => users.id, {
    onDelete: "cascade",
  }),
  sessionCartId: text("sessionCartId").notNull(),
  items: json("items").$type<CartItem[]>().notNull().default([]),
  itemsPrice: numeric("itemsPrice", { precision: 12, scale: 2 }).notNull(),
  shippingPrice: numeric("shippingPrice", {
    precision: 12,
    scale: 2,
  }).notNull(),
  taxPrice: numeric("taxPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("totalPrice", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// ORDERS
export const orders = pgTable("order", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shippingAddress: json("shippingAddress").$type<ShippingAddress>().notNull(),
  paymentMethod: text("paymentMethod").notNull(),
  paymentResult: json("paymentResult").$type<PaymentResult>(),
  itemsPrice: numeric("itemsPrice", { precision: 12, scale: 2 }).notNull(),
  shippingPrice: numeric("shippingPrice", {
    precision: 12,
    scale: 2,
  }).notNull(),
  taxPrice: numeric("taxPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("totalPrice", { precision: 12, scale: 2 }).notNull(),
  isPaid: boolean("isPaid").notNull().default(false),
  paidAt: timestamp("paidAt"),
  isDelivered: boolean("isDelivered").notNull().default(false),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
export const ordersRelations = relations(orders, ({ one, many }) => ({
  orderItems: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItems = pgTable(
  "orderItems",
  {
    orderId: uuid("orderId")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("productId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    image: text("image").notNull(),
  },
  (orderItem) => ({
    compoundKey: primaryKey({
      columns: [orderItem.orderId, orderItem.productId],
    }),
  })
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));
