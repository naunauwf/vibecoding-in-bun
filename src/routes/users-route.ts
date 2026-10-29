import { Elysia, t } from "elysia";
import { registerUserService } from "../services/users-services";

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
  );
