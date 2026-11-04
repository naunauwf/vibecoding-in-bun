import { describe, expect, it } from "bun:test";
import { extractBearerToken } from "../../src/utils/auth";

describe("extractBearerToken", () => {
  it("harus mengembalikan null jika header undefined", () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it("harus mengembalikan null jika header kosong", () => {
    expect(extractBearerToken("")).toBeNull();
  });

  it("harus mengembalikan null jika header bukan Bearer", () => {
    expect(extractBearerToken("Basic abc123")).toBeNull();
    expect(extractBearerToken("Token xyz")).toBeNull();
  });

  it("harus mengembalikan null jika token setelah Bearer kosong", () => {
    expect(extractBearerToken("Bearer ")).toBeNull();
    expect(extractBearerToken("Bearer   ")).toBeNull();
  });

  it("harus mengembalikan token yang valid", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(extractBearerToken(`Bearer ${uuid}`)).toBe(uuid);
  });

  it("harus memotong whitespace di sekitar token", () => {
    expect(extractBearerToken("Bearer  my-token  ")).toBe("my-token");
  });
});
