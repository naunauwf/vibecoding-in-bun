import { Elysia, t } from "elysia";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  logoutUserService,
} from "../services/users-services";
import { extractBearerToken } from "../utils/auth";

/**
 * Route handler untuk domain pengguna (users) dan autentikasi sesi.
 * Prefix dasar: /api/users
 */
export const usersRoute = new Elysia({ prefix: "/api/users" })
  /**
   * Penanganan error validasi schema (TypeBox).
   * Mengubah respon bawaan Elysia menjadi format seragam JSON { error: message } dengan status HTTP 400.
   */
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: error.message };
    }
  })

  /**
   * Endpoint: POST /api/users
   * Mendaftarkan pengguna baru ke dalam sistem.
   * Melakukan validasi panjang karakter input dan mendelegasikan hashing serta persistensi ke service layer.
   */
  .post(
    "/",
    async ({ body, set }) => {
      const result = await registerUserService(body);

      // Tangani kegagalan bisnis (contoh: email sudah terdaftar)
      if (!result.success) {
        set.status = result.statusCode;
        return { error: result.error };
      }

      set.status = result.statusCode;
      return result.data;
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Registrasi User Baru",
        description: "Mendaftarkan user baru dengan nama, email, dan password.",
      },
      // Skema validasi body request registrasi
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 256 }),
        email: t.String({ minLength: 1, maxLength: 100 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
    }
  )

  /**
   * Endpoint: POST /api/users/login
   * Mengautentikasi kredensial pengguna (email & password).
   * Jika valid, menghasilkan token sesi baru (UUID) dan menyimpannya ke tabel sessions.
   */
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await loginUserService(body);

      // Tangani kredensial tidak cocok atau user tidak ditemukan
      if (!result.success) {
        set.status = result.statusCode;
        return { error: result.error };
      }

      set.status = result.statusCode;
      return result.data;
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Login User",
        description: "Mengautentikasi kredensial email dan password serta menghasilkan token sesi UUID.",
      },
      // Skema validasi body request login
      body: t.Object({
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )

  /**
   * Endpoint: GET /api/users/current
   * Mengambil data profil pengguna yang sedang login berdasarkan token sesi Bearer.
   * Field sensitif seperti password dikecualikan dari data yang dikembalikan.
   */
  .get(
    "/current",
    async ({ headers, set }) => {
      // Ekstraksi dan validasi format header Authorization: Bearer <token>
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
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get Current User Profile",
        description: "Mengambil data profil pengguna yang sedang login berdasarkan Bearer token.",
        security: [{ bearerAuth: [] }],
      },
    }
  )

  /**
   * Endpoint: DELETE /api/users/logout
   * Mengakhiri sesi pengguna aktif dengan menghapus record token dari tabel database sessions.
   * Memastikan token yang telah di-logout tidak dapat digunakan kembali.
   */
  .delete(
    "/logout",
    async ({ headers, set }) => {
      // Ekstraksi dan validasi format header Authorization: Bearer <token>
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
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Logout User",
        description: "Mengakhiri sesi pengguna dengan menghapus token sesi dari database.",
        security: [{ bearerAuth: [] }],
      },
    }
  );
