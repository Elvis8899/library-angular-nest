import { z } from "zod";
import { Id, optionalParam, page, Timestamp } from "../common.js";
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

/** The cover's multipart form, for Swagger. */
export const BookCoverUpload = contract(
  z.object({
    file: z.unknown().meta({
      type: "string",
      format: "binary",
      description: "A imagem (JPG, PNG, WEBP ou GIF), até 5 MB",
    }),
  }),
  { id: "BookCoverUpload" },
);

/** The books list's filters and order: part of the name, the creation's
 * moments (from included, before excluded). */
export const BookInfoQuery = z
  .object({
    name: optionalParam(z.string().trim().max(200)).describe(
      "Filtra pelos livros cujo nome contém este texto, sem diferenciar maiúsculas",
    ),
    createdFrom: optionalParam(Timestamp).describe(
      "Só livros criados a partir deste instante (inclusive), em ISO 8601",
    ),
    createdBefore: optionalParam(Timestamp).describe(
      "Só livros criados antes deste instante (exclusive), em ISO 8601",
    ),
    sortBy: optionalParam(z.enum(["name", "createdAt"]))
      .transform((by) => by ?? "createdAt")
      .describe("Campo de ordenação (createdAt se nenhum)"),
    order: optionalParam(z.enum(["asc", "desc"]))
      .transform((order) => order ?? "desc")
      .describe("Direção da ordenação (desc se nenhuma)"),
  })
  .refine(
    ({ createdFrom, createdBefore }) =>
      !createdFrom || !createdBefore || createdFrom < createdBefore,
    "createdFrom deve ser anterior a createdBefore",
  );
export type BookInfoQuery = z.input<typeof BookInfoQuery>;

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
    cover: z
      .string()
      .nullable()
      .describe(
        "A versão da capa, lida em GET v1/bookInfos/{id}/cover?v={cover} (coverPath); null sem capa",
      ),
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
