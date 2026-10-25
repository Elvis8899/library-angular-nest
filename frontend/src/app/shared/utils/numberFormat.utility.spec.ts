import { moneyFormat, qtyFormat } from "@app/shared/utils/numberFormat.utility";

describe("numberFormat", () => {
  it("Should write reais to the centavo, in the language", () => {
    // Intl puts a no-break space after the symbol
    expect(moneyFormat("pt-BR")(1234.5)).toBe("R$ 1.234,50");
    expect(moneyFormat("en-US")(1234.5)).toBe("R$1,234.50");
  });

  it("Should write a quantity with up to 3 decimals", () => {
    expect(qtyFormat("pt-BR")(1234.5)).toBe("1.234,5");
    expect(qtyFormat("en-US")(0.12345)).toBe("0.123");
  });
});
