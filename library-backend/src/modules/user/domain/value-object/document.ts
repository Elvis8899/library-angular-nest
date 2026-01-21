import { z } from "zod";

const removeNonNumeric = (v: string) => v.replace(/\D/g, "");
const cpfMask = (v: string) =>
  v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

// const cepMask = (v: string) => v.replace(/^(\d{5})(\d{3})$/, "$1-$2");
// const phoneMask = (v: string) =>
//   v.replace(
//     /(?:(^\+\d{2})?)(?:([1-9]{2})|([0-9]{3})?)(\d{4,5})(\d{4})/,
//     phoneFormatter,
//   );
// const phoneFormatter = (
//   fullMatch: string,
//   country: string,
//   ddd: string,
//   dddWithZero: string,
//   prefixTel: string,
//   suffixTel: string,
// ) => {
//   if (country)
//     return `${country} (${ddd || dddWithZero}) ${prefixTel}-${suffixTel}`;
//   if (ddd || dddWithZero)
//     return `(${ddd || dddWithZero}) ${prefixTel}-${suffixTel}`;
//   if (prefixTel && suffixTel) return `${prefixTel}-${suffixTel}`;
//   return fullMatch;
// };

export const formatToCPF = (v: string) => cpfMask(removeNonNumeric(v));

export const DocumentType = z
  .string()
  .refine((v) => {
    return [11, 14].includes(removeNonNumeric(v).length);
  }, "CPF inválido")
  .transform((v) => formatToCPF(v));
export type DocumentType = z.infer<typeof DocumentType>;

// export const CEPType = z
//   .string()
//   .refine((v) => removeNonNumeric(v).length === 8, "CEP inválido")
//   .transform((v) => cepMask(removeNonNumeric(v)))
//   .brand("CEP");
// export type CEPType = z.infer<typeof CEPType>;

// export const PhoneType = z
//   .string()
//   .transform((v) => phoneMask(removeNonNumeric(v)))
//   .brand("Phone");
// export type PhoneType = z.infer<typeof PhoneType>;
