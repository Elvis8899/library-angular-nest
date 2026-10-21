import { fromCents, toCents } from "@modules/book/domain/money";
import { z } from "zod";

// The database keeps a book's price in centavos (`priceCents`), and the
// domain in reais (`price`)

const CentsRow = z.looseObject({ priceCents: z.number().int() });

/** A book row with its price in reais. Any other row is left as it is, for
 * the domain schema to refuse. */
export const priceFromCents = (row: unknown): unknown => {
  const parsed = CentsRow.safeParse(row);
  return parsed.success
    ? { ...parsed.data, price: fromCents(parsed.data.priceCents) }
    : row;
};

const RentalRow = z.looseObject({
  bookItem: z.looseObject({ book: z.unknown().transform(priceFromCents) }),
});

/** A rental row, its book item's book with the price in reais. */
export const bookItemPriceFromCents = (row: unknown): unknown => {
  const parsed = RentalRow.safeParse(row);
  return parsed.success ? parsed.data : row;
};

export const priceToCents = (price: number) => ({ priceCents: toCents(price) });
