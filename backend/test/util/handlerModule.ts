import { FakeRefreshSessionRepository } from "@modules/auth/database/fakeRefreshSession.repository";
import { FakeTokenRevocationRepository } from "@modules/auth/database/fakeTokenRevocation.repository";
import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { FakeBookInfoRepository } from "@modules/book/database/fakeBookInfo.repository";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { FakeBookRentalRepository } from "@modules/rental/database/fakeBookRental.repository";
import { FakeUserRepository } from "@modules/user/database/fakeUser.repository";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import {
  Abstract,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuditLog } from "@shared/audit/auditLog";
import { FakeAuditLog } from "@shared/audit/fakeAuditLog";
import { Clock } from "@shared/clock/clock";
import { FakeLoggerService } from "@shared/logger/fakeLogger.service";
import { FakeFileStorage } from "@shared/storage/fakeFileStorage";
import { FileStorage } from "@shared/storage/fileStorage";
import { FPF } from "@shared/utils/application/monads";
import { UseCaseModule } from "@shared/utils/application/useCase.module";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { FakeClock } from "@test/util/fakeClock";
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

// Global too, as the app's AuditLogModule, for UseCase; specs read what was
// audited with get(FakeAuditLog)
@Global()
@Module({
  providers: [FakeAuditLog, { provide: AuditLog, useExisting: FakeAuditLog }],
  exports: [FakeAuditLog, AuditLog],
})
class FakeAuditLogModule {}

/**
 * A testing module for command and query handlers: every repository bound to
 * its in-memory fake, a silent logger, real UUIDs, the clock stopped at
 * 2026-10-21 12:00 UTC (`get(FakeClock).set(…)`), the audit in memory
 * (`get(FakeAuditLog)`), files in memory (`get(FakeFileStorage)`), the
 * domain event publisher, and bcrypt for passwords. Pass the handlers under test; a provider given here replaces the
 * default for its token, as the last binding wins. Get providers with the
 * typed `get(UserRepository)`.
 */
export const createHandlerModule = async (
  providers: Provider[],
  imports: ModuleMetadata["imports"] = [],
): Promise<{ module: TestingModule; get: TypedGet }> => {
  const module = await Test.createTestingModule({
    imports: [FakeLoggerModule, FakeAuditLogModule, UseCaseModule, ...imports],
    providers: [
      RealUUIDGeneratorService,
      FakeClock,
      { provide: Clock, useExisting: FakeClock },
      { provide: PasswordHasher, useClass: BcryptPasswordHasher },
      // Each port resolves to its fake, which get(FakeUserRepository) also
      // returns, typed, for specs that inspect it
      ...fakeRepository(UserRepository, FakeUserRepository),
      ...fakeRepository(RefreshSessionRepository, FakeRefreshSessionRepository),
      ...fakeRepository(
        TokenRevocationRepository,
        FakeTokenRevocationRepository,
      ),
      ...fakeRepository(FileStorage, FakeFileStorage),
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
