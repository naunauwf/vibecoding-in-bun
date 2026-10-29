import { Elysia } from "elysia";
import { config } from "./config/env";
import { healthRoutes } from "./routes/health";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .get("/", () => ({
    message: "Welcome to Vibecoding API in Bun!",
    version: "1.0.0",
  }))
  .use(healthRoutes)
  .use(usersRoute)
  .listen(config.port);

console.log(
  `Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
