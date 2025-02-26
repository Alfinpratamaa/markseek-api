import { error } from "elysia";
import prisma from "../db/db";
import { createSuccessResponse } from "../libs/Response";
import { slugify } from "../utils/slug";
import { getPayloadJwt } from "../utils/auth";

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

export const getCategoryById = async ({
  params,
}: {
  params: { slug: string };
}) => {
  const { slug } = params;
  const category = await prisma.category.findFirst({
    where: {
      slug,
    },
  });

  if (!category) {
    return error(404, `Category with slug ${slug} not found`);
  }

  const { id, name } = category;

  const productById = await prisma.product.findMany({
    where: {
      categoryId: id,
    },
  });

  return {
    status: "success",
    data: {
      Id: id,
      category: name,
      productlength: productById.length,
      products: productById || [],
    },
  };
};

export const createCategory = async ({ body }: { body: { name: string } }) => {
  const { name } = body;

  const slug = slugify(name);

  const category = await prisma.category.findFirst({
    where: {
      slug,
    },
  });
  if (category) {
    return error(400, `Category ${name} already exists`);
  }
  const newCategory = await prisma.category.create({
    data: {
      name,
      slug,
    },
  });
  return createSuccessResponse("Category created successfully", newCategory);
};

export const getAllProducts = async () => {
  const allProducts = await prisma.product.findMany();

  return {
    length: allProducts.length,
    message: "All products",
    data: allProducts || [],
  };
};

export const getProductByslug = async ({
  params,
}: {
  params: { slug: string };
}) => {
  const { slug } = params;
  const product = await prisma.product.findFirst({
    where: {
      slug: slug,
    },
  });
  if (!product) {
    return error(404, `Product with slug ${slug} not found`);
  }
  return createSuccessResponse("Product found", product);
};

export const createProduct = async ({ body, headers, accessJwt }: any) => {
  const payload = await getPayloadJwt(headers, accessJwt);
  if (!payload) {
    return error(401, "Unauthorized");
  }

  console.log("Payload : ", payload);

  const {
    name,
    categoryId,
    images,
    brand,
    description,
    stock,
    price,
    thumbnail,
  } = body;

  if (categoryId === "") {
    return error(400, "Please provide a category id");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    return error(404, `Category with id ${categoryId} not found`);
  }

  if (
    !name ||
    !categoryId ||
    !images ||
    !brand ||
    !description ||
    !stock ||
    !price
  ) {
    return error(400, "Please provide all required fields");
  }
  let slug = slugify(name);

  const productSLug = await prisma.product.findFirst({
    where: {
      slug,
    },
  });

  if (productSLug) {
    slug = `${brand}-${slug}`;
    const productSLug = await prisma.product.findFirst({
      where: {
        slug,
      },
    });
    if (productSLug) {
      slug = `${slug}-${new Date().getTime()}`;
    }
  }
  if (!payload.role || payload.role !== "admin") {
    return error(403, "only admin can create product");
  }

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
      thumbnail: thumbnail || images[0],
      userId: payload.id!,
    },
  });

  return createSuccessResponse("Product created successfully", newProduct);
};

export const updateProduct = async ({
  body,
  params,
  headers,
  accessJwt,
}: any) => {
  try {
    const payload = await getPayloadJwt(headers, accessJwt);
    const { id } = params;
    const { name, categoryId, images, brand, description, stock, price } = body;

    const product = await prisma.product.findFirst({
      where: {
        id,
      },
    });

    if (product?.userId !== payload.id) {
      return error(403, "You are not authorized to update this product");
    }
    if (!product) {
      return error(404, `Product with id ${id} not found`);
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
        categoryId,
        images: Array.isArray(images) ? images : [images],
        brand,
        description,
        stock,
        price,
      },
    });

    return createSuccessResponse(
      "Product updated successfully",
      updatedProduct
    );
  } catch (e: any) {
    console.log(e);
    return error(400, "Error updating product cause : " + e.message);
  }
};

export const deleteProduct = async ({ params, headers, accessJwt }: any) => {
  try {
    const payload = await getPayloadJwt(headers, accessJwt);

    console.log("Payload : ", payload);

    const { id } = params;

    const product = await prisma.product.findFirst({
      where: {
        id,
      },
    });

    if (product?.userId !== payload.id) {
      return error(403, "You are not authorized to delete this product");
    }
    if (!product) {
      return error(404, `Product with id ${id} not found`);
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });
    return createSuccessResponse("Product deleted successfully", undefined);
  } catch (e: any) {
    console.log(e);
    return error(400, "Error deleting product cause : " + e.message);
  }
};
