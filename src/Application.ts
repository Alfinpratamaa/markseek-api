import Elysia from "elysia";
import { authRouter } from "./routes/authRoute";
import { productRouter } from "./routes/productRoute";

export const Application = new Elysia()
  .group("/auth", (app) => app.use(authRouter))
  .use(productRouter);
