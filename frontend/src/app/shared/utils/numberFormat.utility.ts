/** Formats reais in the screen's language, to the centavo: "R$ 1.234,50". */
export const moneyFormat = (locale: string | undefined) => {
  const number = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  });
  return (value: number) => number.format(value);
};

/** Formats a quantity in the screen's language, up to 3 decimals:
 * "1.234,5". */
export const qtyFormat = (locale: string | undefined) => {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  return (value: number) => number.format(value);
};
