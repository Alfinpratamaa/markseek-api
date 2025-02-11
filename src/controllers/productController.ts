import prisma from "../db/db";
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
  const allCategories = await prisma.category.findMany();
  return createSuccessResponse("All categories", allCategories);
};

export const getAllProducts = async () => {
  const allProducts = await prisma.product.findMany();
  return {
    status: "success",
    length: allProducts.length,
    message: "All products",
    data: allProducts,
  };
};

export const getProductById = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { id } = params;
  const product = await prisma.product.findFirst({
    where: {
      id: id,
    },
  });
  return createSuccessResponse("Product found", product);
};

export const createProduct = async ({ body, headers, accessJwt }: any) => {
  const authHeader = headers.authorization;
  console.log("Auth Header : ", authHeader);

  const token = authHeader?.startsWith("bearer ")
    ? authHeader.slice(7)
    : undefined;
  console.log("Token : ", token);

  const payload = await accessJwt.verify(token);

  console.log("Payload : ", payload);

  if (!body) {
    throw new Error("Please provide all product details");
  }
  const { name, categoryId, images, brand, description, stock, price } = body;

  const slug = slugify(name);

  const newProduct = await prisma.product.create({
    data: {
      name,
      categoryId,
      slug,
      images: Array.isArray(images) ? images : [images],
      brand,
      description,
      stock,
      price,
      userId: payload.id!,
    },
  });

  return createSuccessResponse("Product created successfully", newProduct);
};
