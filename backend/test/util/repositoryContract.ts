import { RealRefreshSessionRepository } from "@modules/auth/database/realRefreshSession.repository";
import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { RealBookInfoRepository } from "@modules/book/database/realBookInfo.repository";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RealBookRentalRepository } from "@modules/rental/database/realBookRental.repository";
import { RealUserRepository } from "@modules/user/database/realUser.repository";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { Abstract, Provider, Type } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { FPF } from "@shared/utils/application/monads";
import { createHandlerModule } from "@test/util/handlerModule";
import { resetDatabase } from "@test/util/resetDatabase";
import { typedGet, TypedGet } from "@test/util/typedGet";

/** Which side of a port a contract runs against. */
export type RepositoryKind = "fake" | "real";

const realRepository = <Port>(
  port: Abstract<Port>,
  real: Type<Port>,
): Provider[] => [real, { provide: port, useExisting: real }];

// Each port bound to its Prisma repository, as the modules bind them
const realRepositories: Provider[] = [
  ...realRepository(UserRepository, RealUserRepository),
  ...realRepository(RefreshSessionRepository, RealRefreshSessionRepository),
  // Lending example
  ...realRepository(BookInfoRepository, RealBookInfoRepository),
  ...realRepository(BookRentalRepository, RealBookRentalRepository),
];

/**
 * The repositories a port's contract runs against, fresh for each test: the
 * in-memory fakes, or the Prisma repositories on an emptied database. A
 * contract (`<x>Repository.contract.ts`) takes the kind and is called from
 * `<x>Repository.unit-spec.ts` ("fake") and `.inte-spec.ts` ("real"), so a
 * handler passing with the fake passes with Prisma. Seed through the ports,
 * never Prisma, so the same cases run on both:
 *
 *   const ctx = useRepositories(kind, (get) => ({ users: get(UserRepository) }));
 *
 * Call it in the describe, before hooks that read ctx.
 */
export const useRepositories = <Context extends object>(
  kind: RepositoryKind,
  select: (get: TypedGet) => Context,
): Context => {
  // Filled in by beforeEach, before any test or later hook reads it
  const context: Context = FPF.unsafeCoerce({});
  if (kind === "fake") {
    beforeEach(async () => {
      const { get } = await createHandlerModule([]);
      Object.assign(context, select(get));
    });
    return context;
  }
  // One module for the file: the Prisma repositories hold no state
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService, ...realRepositories],
    }).compile();
  });
  beforeEach(async () => {
    await resetDatabase(module.get(PrismaService));
    Object.assign(context, select(typedGet(module)));
  });
  afterAll(async () => {
    await module.get(PrismaService).$disconnect();
  });
  return context;
};
