import { DocumentType } from "@modules/user/domain/document";

// The check digits and the mask are the contracts' (user/values.spec.ts)
describe("[Unit] Document", () => {
  it("Should not check digits when reading stored documents", () => {
    expect(DocumentType.parse("12345678901")).toBe("123.456.789-01");
  });

  it("Should refuse a stored document of the wrong length", () => {
    expect(DocumentType.safeParse("123456").success).toBe(false);
  });
});
