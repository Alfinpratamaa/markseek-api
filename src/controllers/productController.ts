import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories, products } from "../db/schema";
import { createSuccessResponse } from "../libs/Response";
import { slugify } from "../utils/slug";

export interface CreateProductDTO {
  name: string;
  categoryId: string;
  images: string[];
  brand: string;
  description: string;
  stock: number;
  price: number;
}

export const getAllCategories = async () => {
  const allCategories = await db.select().from(categories);
  return createSuccessResponse("All categories", allCategories);
};

export const getAllProducts = async () => {
  const allProducts = await db.select().from(products);
  return createSuccessResponse("All products", allProducts);
};

export const getProductById = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { id } = params;
  const product = await db.select().from(products).where(eq(products.id, id));
  return createSuccessResponse("Product found", product);
};

export const createProduct = async ({ body, headers, accessJwt }: any) => {
  const authHeader = headers.authorization;
  console.log("Auth Header : ", authHeader);

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  const payload = await accessJwt.verify(token);

  console.log("Payload : ", payload);

  if (!body) {
    throw new Error("Please provide all product details");
  }
  const { name, categoryId, images, brand, description, stock, price } = body;

  const slug = slugify(name);

  const newProduct = await db
    .insert(products)
    .values({
      name,
      slug,
      categoryId,
      images: JSON.stringify(images),
      brand,
      description,
      stock,
      price,
      isFeatured: false,
      createdBy: payload.id, // Mengambil ID dari user yang terautentikasi
      createdAt: new Date(),
    })
    .returning();

  return createSuccessResponse("Product created successfully", newProduct);
};
