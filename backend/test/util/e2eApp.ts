import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { CanActivate } from "@nestjs/common";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/fakeLogger.service";
import { PrismaService } from "@shared/prisma/prisma.service";
import { FPF } from "@shared/utils/application/monads";
import { UseCaseObserver } from "@shared/utils/application/useCaseObserver";
import { AppModule } from "@src/app.module";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { createTestApp } from "@test/util/createTestApp";
import { resetDatabase } from "@test/util/resetDatabase";
import { ScreenChangeCheck } from "@test/util/screenChanges";
import { typedGet, TypedGet } from "@test/util/typedGet";
import { PinoLogger } from "nestjs-pino";
import request from "supertest";

export type E2eOptions = {
  /** Replaces AuthGuard, usually a MockAuthGuardBuilder. Without it,
   * requests need a real token. */
  authGuard?: CanActivate | MockAuthGuardBuilder;
  trustProxy?: boolean | string[];
  /** Runs before app.init(), e.g. to watch the routes Nest registers. */
  beforeInit?: (app: NestFastifyApplication) => void;
  /** Empties the database and resets the MockAuthGuardBuilder before each
   * test, before the spec's own hooks, as most specs need. */
  resetEachTest?: boolean;
};

export type E2eApp = {
  app: NestFastifyApplication;
  module: TestingModule;
  prisma: PrismaService;
  /** A provider, typed from its class token: e2e.get(UserRepository) */
  get: TypedGet;
  /** A supertest request against the app: e2e.http().get("/v1/users") */
  http: () => ReturnType<typeof request>;
};

/** Builds the full app as main.ts does, with a silent logger. */
export const buildE2eApp = async (options: E2eOptions): Promise<E2eApp> => {
  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideProvider(UseCaseObserver)
    .useClass(ScreenChangeCheck);
  const module = await (
    options.authGuard
      ? builder.overrideGuard(AuthGuard).useValue(options.authGuard)
      : builder
  ).compile();
  const app = await createTestApp(module, options.trustProxy);
  options.beforeInit?.(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return {
    app,
    module,
    prisma: module.get(PrismaService),
    get: typedGet(module),
    http: () => request(app.getHttpServer()),
  };
};

export const closeE2eApp = async ({ app, prisma }: E2eApp): Promise<void> => {
  await app.close();
  await prisma.$disconnect();
};

/**
 * Builds the app before the suite's tests, on an empty database, and closes
 * it after them. Call it once at the top of a spec, before its own hooks,
 * which can then use it: `const e2e = useE2eApp({ authGuard, resetEachTest:
 * true })`.
 */
export const useE2eApp = (options: E2eOptions = {}): E2eApp => {
  // Filled in by beforeAll, before any test or later hook reads it
  const e2e: E2eApp = FPF.unsafeCoerce({});
  beforeAll(async () => {
    Object.assign(e2e, await buildE2eApp(options));
    await resetDatabase(e2e.prisma);
  });
  if (options.resetEachTest)
    beforeEach(async () => {
      await resetDatabase(e2e.prisma);
      if (options.authGuard instanceof MockAuthGuardBuilder)
        options.authGuard.reset();
    });
  afterAll(async () => {
    await closeE2eApp(e2e);
  });
  return e2e;
};
