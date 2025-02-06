import { Elysia, file } from "elysia";
import { PORT } from "./config/env";
import { Application } from "./Application";

const app = new Elysia()
  // .use(staticPlugin())
  .group("/api", (app) => app.use(Application))
  .get("/", () => file("public/index.html"))
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
