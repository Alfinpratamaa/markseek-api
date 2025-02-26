import Elysia from "elysia";
import { authRouter } from "./routes/authRoute";
import { productRouter } from "./routes/productRoute";
import { userRouter } from "./routes/userRoute";

export const Application = new Elysia()
  .group("/auth", (app) => app.use(authRouter))
  .group("/user", (app) => app.use(userRouter))
  .use(productRouter);
