import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { userDeleted } from "@modules/user/domain/events/userDeleted.event";
import { userNotFoundException } from "@modules/user/domain/user.errors";
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

const metrics = new Metrics();

describe("[Unit] UseCase", () => {
  const useCase = new UseCase(logger, events, metrics);

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
