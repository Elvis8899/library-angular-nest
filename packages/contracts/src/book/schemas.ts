import { z } from "zod";
import { Id, page, Timestamp } from "../common.js";
import { contract } from "../registry.js";
import { BookItemStatus, inWholeCentavos } from "./values.js";

const BookItemStatusEnum = z.enum(BookItemStatus);

/** An amount in reais, to the centavo. */
export const Money = z
  .number()
  .min(0)
  .refine(inWholeCentavos, "Valor com mais de duas casas decimais");

// Requests

export const BookInfoRequest = contract(
  z.object({
    name: z.string().min(1).describe("Nome do Livro"),
    image: z.string().optional().default("").describe("URL imagem do Livro"),
    price: Money.describe("Preço do Livro"),
  }),
  { id: "BookInfoRequest", description: "Um livro novo, ou o que muda nele" },
);
export type BookInfoRequest = z.input<typeof BookInfoRequest>;

export const BookItemRequest = contract(
  z.object({
    bookId: Id.describe("Id do Livro do Exemplar"),
    status: BookItemStatusEnum.optional().describe("Status do exemplar"),
  }),
  { id: "BookItemRequest", description: "Um exemplar novo de um livro" },
);
export type BookItemRequest = z.input<typeof BookItemRequest>;

// Responses

export const BookItem = contract(
  z.object({
    id: Id,
    status: BookItemStatusEnum,
    bookId: Id,
    createdAt: Timestamp,
    updatedAt: Timestamp,
  }),
  { id: "BookItem", description: "Um exemplar" },
);
export type BookItem = z.input<typeof BookItem>;

export const BookInfo = contract(
  z.object({
    id: Id,
    name: z.string(),
    image: z.string(),
    price: z.number(),
    bookItems: z.array(BookItem),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  }),
  { id: "BookInfo", description: "Um livro e os seus exemplares" },
);
export type BookInfo = z.input<typeof BookInfo>;

export const BookInfoPage = contract(page(BookInfo), {
  id: "BookInfoPage",
  description: "Uma página de livros",
});
export type BookInfoPage = z.input<typeof BookInfoPage>;
