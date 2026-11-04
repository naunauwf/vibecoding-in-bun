import { Elysia, t } from "elysia";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  logoutUserService,
} from "../services/users-services";
import { extractBearerToken } from "../utils/auth";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: error.message };
    }
  })
  .post(
    "/",
    async ({ body, set }) => {
      const result = await registerUserService(body);

      if (!result.success) {
        set.status = result.statusCode;
        return { error: result.error };
      }

      set.status = result.statusCode;
      return result.data;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        email: t.String({ minLength: 1, maxLength: 100 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await loginUserService(body);

      if (!result.success) {
        set.status = result.statusCode;
        return { error: result.error };
      }

      set.status = result.statusCode;
      return result.data;
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    const token = extractBearerToken(headers["authorization"]);
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const result = await getCurrentUserService(token);
    if (!result.success) {
      set.status = result.statusCode;
      return { error: result.error };
    }

    set.status = result.statusCode;
    return result.data;
  })
  .delete("/logout", async ({ headers, set }) => {
    const token = extractBearerToken(headers["authorization"]);
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const result = await logoutUserService(token);
    if (!result.success) {
      set.status = result.statusCode;
      return { error: result.error };
    }

    set.status = result.statusCode;
    return result.data;
  });
