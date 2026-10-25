import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BookInfo, BookInfoPage } from "./book/schemas.js";
import { contractList, contractRef, contractSchemas } from "./openapi.js";

describe("openapi", () => {
  it("Should describe each named contract, pointing at the others by name", () => {
    const schemas = contractSchemas();
    expect(schemas).toHaveProperty("BookInfo");
    expect(schemas["BookInfo"]).not.toHaveProperty("$id");
    expect(JSON.stringify(schemas["BookInfoPage"])).toContain(
      '"$ref":"#/components/schemas/BookInfo"',
    );
  });

  it("Should reference a contract and a list of one", () => {
    expect(contractRef(BookInfoPage)).toEqual({
      $ref: "#/components/schemas/BookInfoPage",
    });
    expect(contractList(BookInfo)).toEqual({
      type: "array",
      items: { $ref: "#/components/schemas/BookInfo" },
    });
  });

  it("Should refuse a schema that isn't a named contract", () => {
    expect(() => contractRef(z.string())).toThrow("isn't a named contract");
  });
});
