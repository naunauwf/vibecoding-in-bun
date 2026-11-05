import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config/env";
import { healthRoutes } from "./routes/health";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Vibecoding API Documentation",
          version: "1.0.0",
          description: "Dokumentasi interaktif RESTful API Vibecoding in Bun",
        },
        tags: [
          { name: "App", description: "Endpoint umum dan pemeriksaan kesehatan aplikasi" },
          { name: "Users", description: "Endpoint manajemen pengguna dan autentikasi sesi" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
              description: "Masukkan token sesi UUID (contoh: 550e8400-e29b-41d4-a716-446655440000)",
            },
          },
        },
      },
    })
  )
  .get(
    "/",
    () => ({
      message: "Welcome to Vibecoding API in Bun!",
      version: "1.0.0",
    }),
    {
      detail: {
        tags: ["App"],
        summary: "Root Welcome",
        description: "Menampilkan pesan sambutan dan versi API.",
      },
    }
  )
  .use(healthRoutes)
  .use(usersRoute)
  .listen(config.port);

console.log(
  `Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
