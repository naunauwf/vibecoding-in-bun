import { describe, expect, it } from "bun:test";
import { app } from "../index";

describe("Simulasi API Users & Auth", () => {
  describe("POST /api/users (Registrasi)", () => {
    it("harus gagal validasi (400) jika request body kosong atau tidak lengkap", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "" }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body).toHaveProperty("error");
    });

    it("harus gagal validasi (400) jika panjang nama 257 karakter (melebihi batas maksimum 256 karakter)", async () => {
      const longName = "a".repeat(257);
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "toolong@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("Expected string length less or equal to 256");
    });

    it("tidak boleh gagal validasi panjang string jika panjang nama tepat 256 karakter", async () => {
      const validName256 = "a".repeat(256);
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: validName256,
            email: "valid256@example.com",
            password: "password123",
          }),
        })
      );

      // Jika ada error, error tidak boleh berasal dari validasi panjang nama
      if (response.status === 400) {
        const body = (await response.json()) as { error: string };
        expect(body.error).not.toContain("Expected string length less or equal");
      }
    });
  });

  describe("POST /api/users/login (Login)", () => {
    it("harus gagal validasi (400) jika email atau password kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "" }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/users/current (Get Current User)", () => {
    it("harus mengembalikan 401 jika header Authorization tidak disertakan", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("harus mengembalikan 401 jika header Authorization bukan Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { Authorization: "Basic 12345" },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("harus mengembalikan 401 jika token Bearer kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { Authorization: "Bearer " },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("harus mengembalikan 401 jika token Bearer tidak ditemukan di database", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { Authorization: "Bearer token-tidak-valid-sama-sekali" },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    it("harus mengembalikan 401 jika header Authorization tidak disertakan", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("harus mengembalikan 401 jika header Authorization bukan Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Token abcde" },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("harus mengembalikan 401 jika token Bearer kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Bearer " },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("harus mengembalikan 401 jika token Bearer tidak ditemukan di database", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Bearer token-tidak-ada-di-db" },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });
  });

  /**
   * Skenario Happy Path End-to-End (membutuhkan koneksi database aktif).
   * Test ini dilewati (skip) jika tidak ada database tersedia, namun
   * menggambarkan alur lengkap: registrasi -> login -> get current -> logout -> verifikasi.
   *
   * Untuk menjalankan: pastikan .env memiliki konfigurasi database yang valid
   * dan jalankan: bun test
   */
  describe.skip("Happy Path End-to-End (requires database)", () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "password123";
    let authToken = "";

    it("harus berhasil registrasi user baru", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: testEmail,
            password: testPassword,
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as { data: string };
      expect(body.data).toBe("OK");
    });

    it("harus berhasil login dan mendapatkan token", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testEmail, password: testPassword }),
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: string };
      expect(typeof body.data).toBe("string");
      expect(body.data.length).toBeGreaterThan(0);
      authToken = body.data;
    });

    it("harus mendapatkan data user saat ini dengan token yang valid", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        data: { id: number; name: string; email: string; created_at: string };
      };
      expect(body.data.email).toBe(testEmail);
      expect(body.data).not.toHaveProperty("password");
    });

    it("harus berhasil logout dan mengembalikan OK", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: string };
      expect(body.data).toBe("OK");
    });

    it("harus mengembalikan 401 setelah logout dengan token yang sama", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        })
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });
  });
});
