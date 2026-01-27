import { Prisma } from "@prisma/client";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

export const bookSeed: Prisma.BookInfoCreateInput[] = [
  {
    // Livro 1 - Sem atraso
    name: "O Incrível Sr Raposo",
    image: "https://covers.openlibrary.org/b/id/15152634-M.jpg",
    price: 100,
    id: createTestId(TableNameEnum.BookInfo, 1),
    bookItems: {
      create: {
        id: createTestId(TableNameEnum.BookItem, 1),
        status: "rented",
        bookRental: {
          create: {
            id: createTestId(TableNameEnum.BookRentalDetails, 1),
            userId: createTestId(TableNameEnum.User, 2),
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
    id: createTestId(TableNameEnum.BookInfo, 2),
    bookItems: {
      create: {
        id: createTestId(TableNameEnum.BookItem, 2),
        status: "rented",
        bookRental: {
          create: {
            id: createTestId(TableNameEnum.BookRentalDetails, 2),
            userId: createTestId(TableNameEnum.User, 2),
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
    id: createTestId(TableNameEnum.BookInfo, 3),
    bookItems: {
      create: {
        id: createTestId(TableNameEnum.BookItem, 3),
        status: "available",
        bookRental: {
          create: {
            id: createTestId(TableNameEnum.BookRentalDetails, 3),
            userId: createTestId(TableNameEnum.User, 2),
            rentalStatus: "finished",
            overdueDate: new Date("2026-01-01"),
            deliveryDate: new Date("2026-01-01"),
          },
        },
      },
    },
  },
];
