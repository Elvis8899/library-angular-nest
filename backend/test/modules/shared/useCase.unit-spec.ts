import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { userDeleted } from "@modules/user/domain/events/userDeleted.event";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { CommandHandler, ICommand, IQuery, QueryHandler } from "@nestjs/cqrs";
import { AUDIT_INPUT_MAX, auditEntryOf } from "@shared/audit/auditEntry";
import { AuditLog } from "@shared/audit/auditLog";
import { FakeAuditLog } from "@shared/audit/fakeAuditLog";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { Metrics } from "@shared/metrics/metrics";
import { E, FPF, O, RTE, TE } from "@shared/utils/application/monads";
import {
  ensureAbsentRTE,
  findOrFailRTE,
} from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { useCaseRuns } from "@test/util/metrics";
import { PinoLogger } from "nestjs-pino";

const fakeLogger = {
  setContext: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
const logger = FPF.unsafeCoerce<typeof fakeLogger, PinoLogger>(fakeLogger);
const publishEvent = vi.fn(() => TE.right(undefined));
const events = FPF.unsafeCoerce<object, DomainEventPublisher>({
  publishEvent,
});

const conflict = () => new Error("conflict");
const user = { id: "u1", name: "Ana" };

beforeEach(() => {
  vi.clearAllMocks();
});

const auditLog = new FakeAuditLog();
const metrics = new Metrics();

class SaveThing implements ICommand {}

@CommandHandler(SaveThing)
class SaveThingHandler {}

class Things implements IQuery {}

@QueryHandler(Things)
class ThingsHandler {}

describe("[Unit] UseCase", () => {
  const useCase = new UseCase(logger, events, auditLog, metrics);

  it("Should log the request under the handler's name and resolve", async () => {
    await expect(
      useCase.run("CreateUser", { name: "Ana" }, RTE.right(1)),
    ).resolves.toBe(1);

    expect(fakeLogger.setContext).toHaveBeenCalledWith("CreateUser");
    expect(fakeLogger.info).toHaveBeenCalledWith(
      { name: "Ana" },
      "CreateUser received",
    );
  });

  it("Should log only the name when there is no input to log", async () => {
    await useCase.run("RefreshTokenCommand", undefined, RTE.right(1));

    expect(fakeLogger.info).toHaveBeenCalledWith(
      "RefreshTokenCommand received",
    );
  });

  it("Should reject with the pipeline's error", async () => {
    await expect(
      useCase.run("CreateUser", {}, RTE.left(conflict())),
    ).rejects.toThrow("conflict");
  });

  it("Should time each run with its outcome: ok, the domain error's kind or error", async () => {
    const before = await useCaseRuns(metrics, "RenameThing");

    await useCase.run("RenameThing", {}, RTE.right(1));
    await expect(
      useCase.run("RenameThing", {}, RTE.left(userNotFoundException())),
    ).rejects.toThrow();
    await expect(
      useCase.run("RenameThing", {}, RTE.left(conflict())),
    ).rejects.toThrow();

    expect(before).toEqual({});
    expect(await useCaseRuns(metrics, "RenameThing")).toEqual({
      ok: 1,
      notFound: 1,
      error: 1,
    });
  });

  it("Should give the pipeline the event publisher", async () => {
    await useCase.run(
      "CreateUser",
      {},
      FPF.pipe(RTE.right(user), RTE.tap(publishRTE(userCreated))),
    );

    expect(publishEvent).toHaveBeenCalledWith(userCreated(user));
  });

  it("Should publish every event a factory builds, in order", async () => {
    await useCase.run(
      "ReplaceUser",
      {},
      FPF.pipe(
        RTE.right(user),
        RTE.tap(
          publishRTE((created: typeof user) => [
            userDeleted(created),
            userCreated(created),
          ]),
        ),
      ),
    );

    expect(publishEvent.mock.calls).toEqual([
      [userDeleted(user)],
      [userCreated(user)],
    ]);
  });
});

describe("[Unit] UseCase's audit", () => {
  const command = new UseCase(
    logger,
    events,
    auditLog,
    metrics,
    new SaveThingHandler(),
  );
  const query = new UseCase(
    logger,
    events,
    auditLog,
    metrics,
    new ThingsHandler(),
  );

  beforeEach(() => {
    auditLog.entries.length = 0;
  });

  it("Should record a command that succeeded, with what it named", async () => {
    const input = { id: "u1", props: { name: "Ana" } };

    await command.run("UpdateUser", input, RTE.right(undefined));

    expect(auditLog.entries).toHaveLength(1);
    expect(auditLog.entries[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(auditLog.entries).toMatchObject([
      {
        userId: null,
        useCase: "UpdateUser",
        recordId: "u1",
        input,
        recordedAt: auditLog.now,
      },
    ]);
  });

  it("Should not record a query, a refused command or one built outside a handler", async () => {
    await query.run("Things", { id: "u1" }, RTE.right([]));
    await expect(
      command.run("UpdateUser", {}, RTE.left(conflict())),
    ).rejects.toThrow("conflict");
    await new UseCase(logger, events, auditLog, metrics).run(
      "UpdateUser",
      {},
      RTE.right(1),
    );

    expect(auditLog.entries).toEqual([]);
  });

  it("Should answer though the entry couldn't be written, and log it", async () => {
    const failing = new UseCase(
      logger,
      events,
      FPF.unsafeCoerce<object, AuditLog>({
        record: () => TE.left(new Error("down")),
      }),
      metrics,
      new SaveThingHandler(),
    );

    await expect(failing.run("SaveThing", {}, RTE.right(1))).resolves.toBe(1);
    expect(fakeLogger.error).toHaveBeenCalledWith(
      { err: new Error("down") },
      "SaveThing not audited",
    );
  });
});

describe("[Unit] auditEntryOf", () => {
  it("Should take the record from a lone id, or from what was created", () => {
    expect(auditEntryOf("DeleteUser", "u1", undefined, "u9")).toEqual({
      userId: "u9",
      useCase: "DeleteUser",
      recordId: "u1",
      input: "u1",
    });
    expect(
      auditEntryOf("CreateUser", { name: "Ana" }, { id: "u2" }, null),
    ).toMatchObject({ recordId: "u2" });
    expect(auditEntryOf("Refresh", undefined, null, null)).toMatchObject({
      recordId: null,
      input: null,
    });
  });

  it("Should keep the input as plain JSON, cut when too large or not JSON", () => {
    const at = new Date("2026-10-21T12:00:00Z");

    expect(auditEntryOf("X", { at }, 1, null).input).toEqual({
      at: "2026-10-21T12:00:00.000Z",
    });
    expect(
      auditEntryOf("X", { rows: "x".repeat(AUDIT_INPUT_MAX) }, 1, null).input,
    ).toEqual({ truncated: true, length: AUDIT_INPUT_MAX + 11 });
    expect(auditEntryOf("X", { big: BigInt(1) }, 1, null).input).toEqual({
      truncated: true,
    });
  });
});

describe("[Unit] findOrFailRTE and ensureAbsentRTE", () => {
  const found = () => TE.right(O.some(user));
  const missing = () => TE.right(O.none);
  const run = <A>(
    task: RTE.ReaderTaskEither<{ logger: PinoLogger }, Error, A>,
  ) => task({ logger })();

  it("Should return what findOrFailRTE finds, or fail", async () => {
    expect(await run(findOrFailRTE(found, "get user", conflict)("u1"))).toEqual(
      E.right(user),
    );
    expect(
      await run(findOrFailRTE(missing, "get user", conflict)("u1")),
    ).toEqual(E.left(conflict()));
  });

  it("Should fail ensureAbsentRTE only on a conflicting row", async () => {
    expect(
      await run(ensureAbsentRTE(missing, "get user", conflict)("u1")),
    ).toEqual(E.right(undefined));
    expect(
      await run(ensureAbsentRTE(found, "get user", conflict)("u1")),
    ).toEqual(E.left(conflict()));
    expect(
      await run(
        ensureAbsentRTE(
          found,
          "get user",
          conflict,
          (other) => other.id !== user.id,
        )("u1"),
      ),
    ).toEqual(E.right(undefined));
  });
});
