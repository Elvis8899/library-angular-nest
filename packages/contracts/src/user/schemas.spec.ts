import { describe, expect, it } from "vitest";
import { LoginRequest } from "../auth/schemas.js";
import { UserChangesRequest, UserRequest } from "./schemas.js";
import { UserRole } from "./values.js";

describe("user contracts", () => {
  it("Should lowercase the email and mask the document", () => {
    expect(
      UserRequest.parse({
        name: "Ana",
        email: "Ana@Example.COM",
        password: "1234",
        cpf: "52998224725",
        role: UserRole.Client,
      }),
    ).toEqual({
      name: "Ana",
      email: "ana@example.com",
      password: "1234",
      cpf: "529.982.247-25",
      role: UserRole.Client,
    });
  });

  it("Should refuse a short password or a wrong document, and take an edit without either", () => {
    const details = {
      name: "Ana",
      email: "ana@example.com",
      role: UserRole.Admin,
    };
    expect(UserRequest.safeParse({ ...details, password: "123" }).success).toBe(
      false,
    );
    expect(
      UserChangesRequest.safeParse({ ...details, cpf: "529.982.247-24" })
        .success,
    ).toBe(false);
    expect(UserChangesRequest.parse(details)).toEqual({ ...details, cpf: "" });
  });

  it("Should log in whatever the email's case", () => {
    expect(
      LoginRequest.parse({ email: "ADMIN@admin.com", password: "x" }).email,
    ).toBe("admin@admin.com");
  });
});
