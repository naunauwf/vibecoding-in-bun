import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

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
  });
});
