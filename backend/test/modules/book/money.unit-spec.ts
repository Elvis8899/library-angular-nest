import { Money, roundToCentavo } from "@modules/book/domain/money";

describe("[Unit] Money", () => {
  it.each([0, 12.5, 0.29, 100])("Should accept %s reais", (amount) => {
    expect(Money.safeParse(amount).success).toBe(true);
  });

  it.each([-1, 12.345])("Should refuse %s reais", (amount) => {
    expect(Money.safeParse(amount).success).toBe(false);
  });

  it("Should round a computed amount to the centavo", () => {
    expect(roundToCentavo(33 * 0.05)).toBe(1.65);
    expect(roundToCentavo(33.33 * 0.05)).toBe(1.67);
  });
});
