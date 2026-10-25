import { z } from "zod";
import { Id, page, Timestamp } from "../common.js";
import { contract } from "../registry.js";
import { RentalStatus } from "./values.js";

// Requests

export const RentBookRequest = contract(
  z.object({
    bookItemId: Id.describe("Id do Exemplar de Livro"),
    userId: Id.describe(
      "Id do Usuário; o de um cliente é sempre o dele, o que vier aqui fica de fora",
    ),
  }),
  { id: "RentBookRequest", description: "O empréstimo de um exemplar" },
);
export type RentBookRequest = z.input<typeof RentBookRequest>;

// Responses

export const RentalFines = contract(
  z.object({
    overdue: z.boolean().describe("Se passou da data de entrega"),
    fixed: z.number().describe("Multa fixa pelo atraso"),
    days: z.number().int().describe("Dias de atraso (negativo se no prazo)"),
    perDayValue: z.number().describe("Multa por dia: 5% do preço do livro"),
    total: z.number().describe("Multa total até hoje"),
  }),
  { id: "RentalFines", description: "A multa de um empréstimo, até hoje" },
);
export type RentalFines = z.input<typeof RentalFines>;

export const BookRental = contract(
  z.object({
    id: Id,
    bookItemId: Id,
    userId: Id,
    userName: z.string(),
    bookName: z.string(),
    rentalStatus: z.enum(RentalStatus),
    overdueDate: Timestamp.describe("Data de entrega"),
    deliveryDate: Timestamp.nullable().describe("Quando foi devolvido"),
    fines: RentalFines,
    createdAt: Timestamp,
    updatedAt: Timestamp,
  }),
  { id: "BookRental", description: "Um empréstimo e a sua multa" },
);
export type BookRental = z.input<typeof BookRental>;

export const BookRentalPage = contract(page(BookRental), {
  id: "BookRentalPage",
  description: "Uma página de empréstimos",
});
export type BookRentalPage = z.input<typeof BookRentalPage>;
