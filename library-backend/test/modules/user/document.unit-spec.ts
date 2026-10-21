import {
  CheckedDocumentType,
  DocumentType,
  formatDocument,
  isValidDocument,
} from "@modules/user/domain/document";

describe("[Unit] Document", () => {
  it.each([
    ["CPF", "52998224725"],
    ["formatted CPF", "529.982.247-25"],
    ["CNPJ", "11222333000181"],
    ["formatted CNPJ", "11.222.333/0001-81"],
    ["alphanumeric CNPJ", "12ABC34501DE35"],
    ["lowercase alphanumeric CNPJ", "12.abc.345/01de-35"],
  ])("Should accept a valid %s", (_: string, document: string) => {
    expect(isValidDocument(document)).toBe(true);
  });

  it.each([
    ["CPF with wrong first check digit", "52998224715"],
    ["CPF with wrong second check digit", "52998224726"],
    ["CPF with repeated digits", "11111111111"],
    ["CNPJ with wrong check digits", "11222333000182"],
    ["CNPJ with repeated digits", "00000000000000"],
    ["alphanumeric CNPJ with wrong check digits", "12ABC34501DE36"],
    ["CPF with letters", "5299822472A"],
    ["document with wrong length", "123456"],
  ])("Should reject a %s", (_: string, document: string) => {
    expect(isValidDocument(document)).toBe(false);
  });

  it("Should format CPF and CNPJ", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatDocument("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  });

  it("Should not check digits when reading stored documents", () => {
    expect(DocumentType.parse("12345678901")).toBe("123.456.789-01");
  });

  it("Should check digits on input, allowing empty document", () => {
    expect(CheckedDocumentType.safeParse("").success).toBe(true);
    expect(CheckedDocumentType.safeParse("529.982.247-25").success).toBe(true);
    expect(CheckedDocumentType.safeParse("12345678901").success).toBe(false);
  });
});
