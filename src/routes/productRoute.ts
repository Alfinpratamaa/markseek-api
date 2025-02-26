import {
  deleteProduct,
  getCategoryById,
  getProductByslug,
  updateProduct,
} from "./../controllers/productController";
import { jwt } from "@elysiajs/jwt";
import Elysia from "elysia";
import {
  createCategory,
  createProduct,
  getAllCategories,
  getAllProducts,
} from "../controllers/productController";
import { JWT_SECRET } from "../config/env";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../utils/constants";

export const productRouter = new Elysia()
  .use(
    jwt({
      name: "accessJwt",
      secret: JWT_SECRET,
      exp: ACCESS_TOKEN_EXPIRES_IN,
    })
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: JWT_SECRET,
      exp: REFRESH_TOKEN_EXPIRES_IN,
    })
  )
  .get("/categories", getAllCategories)
  .get("/category/:slug", getCategoryById)
  .post("/categories", createCategory)
  .get("/products", getAllProducts)
  .get("/product/:slug", getProductByslug)
  .post("/products", createProduct)
  .put("/product/:id", updateProduct)
  .delete("/product/:id", deleteProduct);
