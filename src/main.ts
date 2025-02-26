import { verifyEmail } from "./controllers/authController";
import { Elysia, file } from "elysia";
import { PORT } from "./config/env";
import { Application } from "./Application";
import cors from "@elysiajs/cors";

const app = new Elysia()
  // .use(staticPlugin())
  .use(cors())
  .group("/api", (app) => app.use(Application))
  .get("/verify", verifyEmail)
  .get("/", () => file("public/index.html"))
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
