import { Prisma } from "@prisma/client";

const createId = (prefix: number, index: number) =>
  (prefix * 1e-8).toFixed(8).replace("0.", "") +
  "-0000-0000-0002-" +
  (index * 1e-12).toFixed(12).replace("0.", "");

export const bookSeed: Prisma.BookInfoCreateInput[] = [
  {
    // Livro 1 - Sem atraso
    name: "O Incrível Sr Raposo",
    image: "https://covers.openlibrary.org/b/id/15152634-M.jpg",
    price: 100,
    id: createId(2, 1),
    bookItems: {
      create: {
        id: createId(3, 1),
        status: "rented",
        bookRental: {
          create: {
            id: createId(4, 1),
            userId: "00000000-0000-0000-0001-000000000002",
            rentalStatus: "rented",
            overdueDate: new Date("2028-01-01"),
          },
        },
      },
    },
  },
  {
    // Livro 2 - Com atraso
    name: "O Hobbit",
    image: "https://covers.openlibrary.org/b/id/14627222-M.jpg",
    price: 100,
    id: createId(2, 2),
    bookItems: {
      create: {
        id: createId(3, 2),
        status: "rented",
        bookRental: {
          create: {
            id: createId(4, 2),
            userId: "00000000-0000-0000-0001-000000000002",
            rentalStatus: "rented",
            overdueDate: new Date("2026-01-01"),
          },
        },
      },
    },
  },
  {
    name: "O Senhor dos Anéis: A Sociedade do Anel",
    image: "https://covers.openlibrary.org/b/id/15129594-M.jpg",
    price: 100,
    id: createId(2, 3),
    bookItems: {
      create: {
        id: createId(3, 3),
        status: "available",
        bookRental: {
          create: {
            id: createId(4, 3),
            userId: "00000000-0000-0000-0001-000000000002",
            rentalStatus: "finished",
            overdueDate: new Date("2026-01-01"),
            deliveryDate: new Date("2026-01-01"),
          },
        },
      },
    },
  },
];
