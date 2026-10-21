import { FakeRefreshSessionRepository } from "@modules/auth/database/fakeRefreshSession.repository";
import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@modules/book/database/fakeBookInfo.repository";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@modules/rental/database/fakeBookRental.repository";
import { FakeUserRepository } from "@modules/user/database/fakeUser.repository";
import { UserRepository } from "@modules/user/database/user.repository.port";
import {
  Abstract,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/fakeLogger.service";
import { FPF } from "@shared/utils/application/monads";
import { UseCaseModule } from "@shared/utils/application/useCase.module";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { typedGet, TypedGet } from "@test/util/typedGet";
import { PinoLogger } from "nestjs-pino";

const fakeRepository = <Port>(
  port: Abstract<Port>,
  fake: Type<Port>,
): Provider[] => [fake, { provide: port, useExisting: fake }];

// Global, as nestjs-pino's LoggerModule is in the app, so that UseCase finds it
@Global()
@Module({
  providers: [{ provide: PinoLogger, useClass: FakeLoggerService }],
  exports: [PinoLogger],
})
class FakeLoggerModule {}

/**
 * A testing module for command and query handlers: every repository bound to
 * its in-memory fake, a silent logger, real UUIDs and the domain event
 * publisher. Pass the handlers under test; a provider given here replaces the
 * default for its token, as the last binding wins. Get providers with the
 * typed `get(UserRepository)`.
 */
export const createHandlerModule = async (
  providers: Provider[],
  imports: ModuleMetadata["imports"] = [],
): Promise<{ module: TestingModule; get: TypedGet }> => {
  const module = await Test.createTestingModule({
    imports: [FakeLoggerModule, UseCaseModule, ...imports],
    providers: [
      RealUUIDGeneratorService,
      // Each port resolves to its fake, which get(FakeUserRepository) also
      // returns, typed, for specs that inspect it
      ...fakeRepository(UserRepository, FakeUserRepository),
      ...fakeRepository(RefreshSessionRepository, FakeRefreshSessionRepository),
      // Lending example
      ...fakeRepository(BookInfoRepository, FakeBookInfoRepository),
      ...fakeRepository(BookRentalRepository, FakeBookRentalRepository),
      ...providers,
    ],
  }).compile();
  return { module, get: typedGet(module) };
};

export type HandlerModuleOptions = {
  providers: Provider[];
  imports?: ModuleMetadata["imports"];
  /** Runs module.init(), which registers CQRS event handlers. */
  init?: boolean;
};

/**
 * Rebuilds the handler module before each test and returns the providers
 * the spec uses, typed from `select`, so each is named once:
 *
 *   const ctx = useHandlerModule({ providers: [DeleteUserHandler] }, (get) => ({
 *     handler: get(DeleteUserHandler),
 *   }));
 *
 * Call it in the describe, before hooks that read ctx.
 */
export const useHandlerModule = <Context extends object>(
  options: HandlerModuleOptions,
  select: (get: TypedGet) => Context,
): Context => {
  // Filled in by beforeEach, before any test or later hook reads it
  const context: Context = FPF.unsafeCoerce({});
  beforeEach(async () => {
    const { module, get } = await createHandlerModule(
      options.providers,
      options.imports,
    );
    if (options.init) await module.init();
    Object.assign(context, select(get));
  });
  return context;
};
