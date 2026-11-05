import { describe, expect, it } from "bun:test";
import { app } from "../index";

describe("Swagger Documentation Endpoint", () => {
  it("harus menyajikan antarmuka Swagger UI di /swagger dengan status 200", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/swagger", {
        method: "GET",
      })
    );

    expect(response.status).toBe(200);
    const contentType = response.headers.get("content-type") || "";
    expect(contentType).toContain("text/html");
  });

  it("harus menyajikan spesifikasi OpenAPI JSON di /swagger/json dengan status 200", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/swagger/json", {
        method: "GET",
      })
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as any;
    expect(data).toHaveProperty("openapi");
    expect(data.info.title).toBe("Vibecoding API Documentation");
    expect(data.paths).toHaveProperty("/api/users");
  });
});
