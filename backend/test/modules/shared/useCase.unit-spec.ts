import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { AUDIT_INPUT_MAX, auditEntryOf } from "@shared/audit/auditEntry";
import { AuditLog } from "@shared/audit/auditLog";
import { FakeAuditLog } from "@shared/audit/fakeAuditLog";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  resourceChanged,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { Metrics } from "@shared/metrics/metrics";
import {
  Command,
  CommandHandler,
  Handles,
  Query,
  QueryHandler,
} from "@shared/utils/application/cqrs";
import { E, FPF, O, RTE, TE } from "@shared/utils/application/monads";
import {
  bindAll,
  orConflict,
  orFail,
  perform,
} from "@shared/utils/application/perform";
import {
  nothingChangedRTE,
  publishRTE,
  UseCase,
} from "@shared/utils/application/useCase";
import { UseCaseRun } from "@shared/utils/application/useCaseObserver";
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

class CreateUser extends Command {}

@CommandHandler(CreateUser)
class CreateUserHandler implements Handles<CreateUser> {
  execute = () => Promise.resolve();
}

class RenameThing extends Command {}

@CommandHandler(RenameThing)
class RenameThingHandler implements Handles<RenameThing> {
  execute = () => Promise.resolve();
}

class SaveThing extends Command {}

@CommandHandler(SaveThing)
class SaveThingHandler implements Handles<SaveThing> {
  execute = () => Promise.resolve();
}

class ThingsQuery extends Query<void> {}

@QueryHandler(ThingsQuery)
class ThingsQueryHandler implements Handles<ThingsQuery> {
  execute = () => Promise.resolve();
}

const runs: UseCaseRun[] = [];
const observer = { ran: (run: UseCaseRun) => runs.push(run) };

const useCaseFor = (handler?: object, log: AuditLog = auditLog) =>
  new UseCase(logger, events, log, metrics, observer, handler);

const usersChanged = ({ id }: { id: string }) =>
  resourceChanged({ resource: Resource.Users, key: id });

describe("[Unit] UseCase", () => {
  const useCase = useCaseFor(new CreateUserHandler());

  it("Should log the request under the handler's name and resolve", async () => {
    await expect(useCase.run({ name: "Ana" }, RTE.right(1))).resolves.toBe(1);

    expect(fakeLogger.setContext).toHaveBeenCalledWith("CreateUser");
    expect(fakeLogger.info).toHaveBeenCalledWith(
      { name: "Ana" },
      "CreateUser received",
    );
  });

  it("Should log only the name when there is no input to log", async () => {
    await useCase.run(undefined, RTE.right(1));

    expect(fakeLogger.info).toHaveBeenCalledWith("CreateUser received");
  });

  it("Should name a query's runs without its Query suffix", async () => {
    await useCaseFor(new ThingsQueryHandler()).run({}, RTE.right(1));

    expect(fakeLogger.setContext).toHaveBeenCalledWith("Things");
  });

  it("Should refuse to be built for anything but a handler", () => {
    expect(() => useCaseFor()).toThrow("only a command's or query's handler");
    expect(() => useCaseFor({})).toThrow("only a command's or query's handler");
  });

  it("Should reject with the pipeline's error", async () => {
    await expect(useCase.run({}, RTE.left(conflict()))).rejects.toThrow(
      "conflict",
    );
  });

  it("Should time each run with its outcome: ok, the domain error's kind or error", async () => {
    const before = await useCaseRuns(metrics, "RenameThing");

    const renaming = useCaseFor(new RenameThingHandler());

    await renaming.run({}, RTE.right(1));
    await expect(
      renaming.run({}, RTE.left(userNotFoundException())),
    ).rejects.toThrow();
    await expect(renaming.run({}, RTE.left(conflict()))).rejects.toThrow();

    expect(before).toEqual({});
    expect(await useCaseRuns(metrics, "RenameThing")).toEqual({
      ok: 1,
      notFound: 1,
      error: 1,
    });
  });

  it("Should give the pipeline the event publisher", async () => {
    await useCase.run(
      {},
      FPF.pipe(RTE.right(user), RTE.tap(publishRTE(userCreated))),
    );

    expect(publishEvent).toHaveBeenCalledWith(userCreated(user));
  });

  it("Should tell the observer each run, with the events it published", async () => {
    runs.length = 0;

    await useCase.run(
      {},
      FPF.pipe(RTE.right(user), RTE.tap(publishRTE(userCreated))),
    );
    await expect(useCase.run({}, RTE.left(conflict()))).rejects.toThrow();
    await useCaseFor(new ThingsQueryHandler()).run({}, RTE.right(1));
    await useCase.run({}, nothingChangedRTE);

    const run = { name: "CreateUser", command: true, changedNothing: false };
    expect(runs).toEqual([
      { ...run, succeeded: true, published: [userCreated(user).eventKey] },
      { ...run, succeeded: false, published: [] },
      {
        ...run,
        name: "Things",
        command: false,
        succeeded: true,
        published: [],
      },
      { ...run, succeeded: true, published: [], changedNothing: true },
    ]);
  });

  it("Should publish every event a factory builds, in order", async () => {
    await useCase.run(
      {},
      FPF.pipe(
        RTE.right(user),
        RTE.tap(
          publishRTE((created: typeof user) => [
            userCreated(created),
            usersChanged(created),
          ]),
        ),
      ),
    );

    expect(publishEvent.mock.calls).toEqual([
      [userCreated(user)],
      [usersChanged(user)],
    ]);
  });
});

describe("[Unit] UseCase's audit", () => {
  const command = useCaseFor(new SaveThingHandler());
  const query = useCaseFor(new ThingsQueryHandler());

  beforeEach(() => {
    auditLog.entries.length = 0;
  });

  it("Should record a command that succeeded, with what it named", async () => {
    const input = { section: "pallet", id: "w1", props: { name: "Ana" } };

    await command.run(input, RTE.right(undefined));

    expect(auditLog.entries).toHaveLength(1);
    expect(auditLog.entries[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(auditLog.entries).toMatchObject([
      {
        userId: null,
        useCase: "SaveThing",
        recordId: "w1",
        input,
        recordedAt: auditLog.now,
      },
    ]);
  });

  it("Should not record a query or a refused command", async () => {
    await query.run({ id: "w1" }, RTE.right([]));
    await expect(command.run({}, RTE.left(conflict()))).rejects.toThrow(
      "conflict",
    );

    expect(auditLog.entries).toEqual([]);
  });

  it("Should answer though the entry couldn't be written, and log it", async () => {
    const failing = useCaseFor(
      new SaveThingHandler(),
      FPF.unsafeCoerce<object, AuditLog>({
        record: () => TE.left(new Error("down")),
      }),
    );

    await expect(failing.run({}, RTE.right(1))).resolves.toBe(1);
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

describe("[Unit] perform, orFail, orConflict and bindAll", () => {
  class FakeUserRepository {
    findById = (id: string) => TE.right(id === user.id ? O.some(user) : O.none);
    failing = () => TE.left(conflict());
  }
  const users = new FakeUserRepository();
  const run = <A>(
    task: RTE.ReaderTaskEither<{ logger: PinoLogger }, Error, A>,
  ) => task({ logger })();

  it("Should run a port's method as a step logged under its name", async () => {
    expect(await run(perform(users).findById("u1"))).toEqual(
      E.right(O.some(user)),
    );
    expect(fakeLogger.debug).toHaveBeenCalledWith(
      { value: { some: { id: user.id } } },
      "UserRepository.findById succeeded",
    );

    expect(await run(perform(users).failing())).toEqual(E.left(conflict()));
    expect(fakeLogger.warn).toHaveBeenCalledWith(
      "Error - UserRepository.failing failed",
    );
  });

  it("Should return what orFail finds, or fail", async () => {
    expect(await run(orFail(perform(users).findById("u1"), conflict))).toEqual(
      E.right(user),
    );
    expect(await run(orFail(perform(users).findById("u2"), conflict))).toEqual(
      E.left(conflict()),
    );
  });

  it("Should fail orConflict only on a conflicting row", async () => {
    expect(
      await run(orConflict(perform(users).findById("u2"), conflict)),
    ).toEqual(E.right(undefined));
    expect(
      await run(orConflict(perform(users).findById("u1"), conflict)),
    ).toEqual(E.left(conflict()));
    expect(
      await run(
        orConflict(
          perform(users).findById("u1"),
          conflict,
          (other) => other.id !== user.id,
        ),
      ),
    ).toEqual(E.right(undefined));
  });

  it("Should run bindAll's lookups at once and bind them to the scope", async () => {
    const started: string[] = [];
    const lookup =
      (
        name: string,
        value: number,
      ): RTE.ReaderTaskEither<unknown, Error, number> =>
      () =>
      async () => {
        started.push(name);
        // Each waits for the other to start
        await new Promise((resolve) => setTimeout(resolve, 5));
        return E.right(started.length === 2 ? value : -1);
      };
    expect(
      await run(
        FPF.pipe(
          RTE.right({ id: "u1" }),
          bindAll(({ id }) => ({
            user: orFail(perform(users).findById(id), conflict),
            a: lookup("a", 1),
            b: lookup("b", 2),
          })),
        ),
      ),
    ).toEqual(E.right({ id: "u1", user, a: 1, b: 2 }));
  });

  it("Should refuse, in its types, a bindAll lookup named as the scope's", () => {
    const rebinds = FPF.pipe(
      RTE.right({ id: "u1" }),
      bindAll(() => ({ id: perform(users).findById("u2") })),
    );
    // @ts-expect-error: a lookup can't rebind a name the scope has
    const checked: RTE.ReaderTaskEither<unknown, Error, unknown> = rebinds;
    expect(checked).toBe(rebinds);
  });

  it("Should fail bindAll with the first lookup, in order, that fails", async () => {
    const notFound = () => new Error("notFound");
    expect(
      await run(
        FPF.pipe(
          RTE.right({ id: "u2" }),
          bindAll(({ id }) => ({
            user: orFail(perform(users).findById(id), notFound),
            other: perform(users).failing(),
          })),
        ),
      ),
    ).toEqual(E.left(notFound()));
  });
});
