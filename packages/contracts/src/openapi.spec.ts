import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  contractList,
  contractQuery,
  contractRef,
  contractSchemas,
} from "./openapi.js";
import { UserPage, UserResponse } from "./user/schemas.js";

describe("openapi", () => {
  it("Should describe each named contract, pointing at the others by name", () => {
    const schemas = contractSchemas();
    expect(schemas).toHaveProperty("UserResponse");
    expect(schemas["UserResponse"]).not.toHaveProperty("$id");
    expect(JSON.stringify(schemas["UserPage"])).toContain(
      '"$ref":"#/components/schemas/UserResponse"',
    );
  });

  it("Should reference a contract and a list of one", () => {
    expect(contractRef(UserPage)).toEqual({
      $ref: "#/components/schemas/UserPage",
    });
    expect(contractList(UserResponse)).toEqual({
      type: "array",
      items: { $ref: "#/components/schemas/UserResponse" },
    });
  });

  it("Should refuse a schema that isn't a named contract", () => {
    expect(() => contractRef(z.string())).toThrow("isn't a named contract");
  });

  it("Should describe each query parameter, required or not", () => {
    const params = contractQuery(
      z.object({
        day: z.iso.date().describe("O dia"),
        page: z.number().optional(),
      }),
    );
    expect(params).toEqual([
      {
        name: "day",
        required: true,
        description: "O dia",
        schema: expect.objectContaining({ type: "string", format: "date" }),
      },
      { name: "page", required: false, schema: { type: "number" } },
    ]);
  });
});
