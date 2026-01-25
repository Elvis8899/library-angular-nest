import { Prisma } from "@prisma/client";

export const userSeed: Prisma.UserCreateInput[] = [
  {
    name: "Usuario admin",
    id: "00000000-0000-0000-0001-000000000001",
    cpf: "",
    email: "admin@admin.com",
    password: "admin",
    role: "admin",
  },
  {
    name: "Usuario cliente",
    id: "00000000-0000-0000-0001-000000000002",
    cpf: "12345678901",
    email: "client@client.com",
    password: "client",
    role: "client",
  },
];
