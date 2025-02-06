import Elysia from "elysia";
import { authRouter } from "./routes/authRoute";
import { productRouter } from "./routes/productRoute";
import { db } from "./db";
import { users } from "./db/schema";
import { createSuccessResponse } from "./libs/Response";

export const Application = new Elysia()
  .group("/auth", (app) => app.use(authRouter))
  .use(productRouter)
  .get("/users", async () => {
    const allUsers = await db.select().from(users);
    return createSuccessResponse("All users", allUsers);
  });
