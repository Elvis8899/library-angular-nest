import { Prisma } from "@db/generated/client";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

export const userSeed: Prisma.UserCreateInput[] = [
  {
    name: "Usuario admin",
    id: createTestId(TableNameEnum.User, 1),
    email: "admin@admin.com",
    password: "admin",
    role: "admin",
  },
  {
    name: "Usuario cliente",
    id: createTestId(TableNameEnum.User, 2),
    cpf: "52998224725",
    email: "client@client.com",
    password: "client",
    role: "client",
  },
];
