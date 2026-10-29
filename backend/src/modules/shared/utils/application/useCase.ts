import { Inject, Injectable, Optional, Scope } from "@nestjs/common";
import { INQUIRER } from "@nestjs/core";
import { auditEntryOf, NewAuditEntry } from "@shared/audit/auditEntry";
import { AuditLog } from "@shared/audit/auditLog";
import { currentRequesterId } from "@shared/audit/requester";
import { Clock } from "@shared/clock/clock";
import { DomainEvent } from "@shared/domainEventPublisher/domainEvent";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  ResourceChange,
  resourceChanged,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { Metrics, outcomeOf } from "@shared/metrics/metrics";
import {
  Command,
  Handles,
  Query,
  ResultOf,
  useCaseOf,
} from "@shared/utils/application/cqrs";
import { executeTask } from "@shared/utils/application/executeTask";
import { E, FPF, RTE, TE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { Recording, recordingOf } from "@shared/utils/application/recording";
import { UseCaseObserver } from "@shared/utils/application/useCaseObserver";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { PinoLogger } from "nestjs-pino";

/** What a handler's pipeline reads: the logger and the event publisher. */
export type UseCaseEnv = {
  logger: PinoLogger;
  events: RunEvents;
};

/** A run's publisher: the app's, keeping what the run published (and
 * whether it changed nothing on purpose) for the observer. */
export type RunEvents = Pick<RunEventPublisher, "publishEvent" | "unchanged">;

class RunEventPublisher {
  readonly published: string[] = [];
  changedNothing = false;

  constructor(private readonly events: DomainEventPublisher) {}

  publishEvent: DomainEventPublisher["publishEvent"] = (event) => {
    this.published.push(event.eventKey);
    return this.events.publishEvent(event);
  };

  unchanged = (): void => {
    this.changedNothing = true;
  };
}

/**
 * Runs a command or query handler's pipeline: logs the request under the
 * use case's name (`useCaseOf`: the command's class name, or the query's
 * without "Query") and turns the task into the Promise Nest expects. A
 * command that succeeds is audited: who asked, the handler's name and what
 * it logs of the input, after its transaction (an entry that fails to be
 * written is logged, the command still answers). Each run is timed, with
 * its outcome, for the metrics. Transient, so each handler gets its own
 * logger and context, and knows whose it is; only a handler marked by
 * `@CommandHandler` or `@QueryHandler` may inject it.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class UseCase {
  private readonly name: string;
  private readonly audited: boolean;

  constructor(
    private readonly logger: PinoLogger,
    private readonly events: DomainEventPublisher,
    private readonly auditLog: AuditLog,
    private readonly metrics: Metrics,
    private readonly observer: UseCaseObserver,
    // The handler it runs for; none when built outside one
    @Optional() @Inject(INQUIRER) handler?: object,
  ) {
    const useCase = handler && useCaseOf(handler);
    if (!useCase)
      throw new Error("UseCase runs only a command's or query's handler");
    this.name = useCase.name;
    this.audited = useCase.command;
  }

  /**
   * @param input what is logged with the request, and a command's audit
   * entry keeps; leave out secrets (passwords, tokens), or pass undefined to
   * log none
   */
  run<A>(
    input: unknown,
    task: RTE.ReaderTaskEither<UseCaseEnv, Error, A>,
  ): Promise<A> {
    const name = this.name;
    this.logger.setContext(name);
    if (input === undefined) this.logger.info(`${name} received`);
    else this.logger.info(input, `${name} received`);
    const requesterId = currentRequesterId();
    const end = this.metrics.startUseCase(name);
    const events = new RunEventPublisher(this.events);
    const timed = FPF.pipe(
      task({ logger: this.logger, events }),
      TE.tap((result) =>
        this.audited
          ? this.audit(auditEntryOf(name, input, result, requesterId))
          : TE.right(undefined),
      ),
    );
    return executeTask(async () => {
      const result = await timed();
      end(E.isRight(result) ? "ok" : outcomeOf(result.left));
      this.observer.ran({
        name,
        command: this.audited,
        succeeded: E.isRight(result),
        published: events.published,
        changedNothing: events.changedNothing,
      });
      return result;
    });
  }

  private audit = (entry: NewAuditEntry): TE.TaskEither<Error, undefined> =>
    FPF.pipe(
      this.auditLog.record(entry),
      TE.map(() => undefined),
      TE.orElse((error) => {
        this.logger.error({ err: error }, `${entry.useCase} not audited`);
        return TE.right(undefined);
      }),
    );
}

/**
 * A command's or query's handler: it says how to answer (`pipeline`), and
 * `execute` runs that through its UseCase, so every handler is logged,
 * timed and, a command, audited.
 *
 *   @CommandHandler(CreateUser)
 *   export class CreateUserHandler extends UseCaseHandler<CreateUser> {
 *     protected pipeline(command: CreateUser) { return FPF.pipe(…); }
 *   }
 */
export abstract class UseCaseHandler<
  M extends Command<unknown> | Query<unknown>,
> implements Handles<M> {
  // Injected into the properties, so handlers' constructors take only their
  // own dependencies; named apart from those, which may be a clock too
  @Inject(UseCase) private readonly useCase!: UseCase;
  @Inject(Clock) private readonly recordingClock!: Clock;
  @Inject(RealUUIDGeneratorService)
  private readonly recordingUuids!: RealUUIDGeneratorService;

  protected abstract pipeline(
    message: M,
  ): RTE.ReaderTaskEither<UseCaseEnv, Error, ResultOf<M>>;

  /** What the run logs and a command's audit entry keeps: the message, or
   * less (never passwords or tokens; undefined logs none). */
  protected logged(message: M): unknown {
    return message;
  }

  /** Who records a change and when, for the rules that stamp rows: the
   * clock read once, ids from the handler's UUIDs. */
  protected recordingBy(recordedById: string): Recording {
    return recordingOf(this.recordingClock, this.recordingUuids, recordedById);
  }

  execute(message: M): Promise<ResultOf<M>> {
    return this.useCase.run(this.logged(message), this.pipeline(message));
  }
}

/**
 * Publishes the event built from the pipeline's value, which it keeps:
 * `RTE.tap(publishRTE(userCreated))`. A factory may build several (a write
 * that changes more than one record), published in order.
 */
export const publishRTE =
  <A>(toEvent: (data: A) => DomainEvent | readonly DomainEvent[]) =>
  (data: A): RTE.ReaderTaskEither<UseCaseEnv, Error, void> =>
    RTE.asksReaderTaskEither(({ events }) => {
      const built = toEvent(data);
      return FPF.pipe(
        "eventKey" in built ? [built] : built,
        RTE.traverseSeqArray((event) => perform(events).publishEvent(event)),
        RTE.asUnit,
      );
    });

/**
 * A command's branch that writes nothing, so tells no screen, on purpose:
 * `O.match(() => nothingChangedRTE, …)` for a worker already active.
 */
export const nothingChangedRTE: RTE.ReaderTaskEither<UseCaseEnv, never, void> =
  RTE.asks(({ events }) => {
    events.unchanged();
  });

/**
 * Ends a write command, after its transaction committed: tells the screens
 * that show what it changed to reload (`resource.changed`, one per change).
 * `RTE.tap((book) => changedRTE({ resource: Resource.Books, key: book.id }))`
 * keeps the pipeline's value.
 */
export const changedRTE = (
  ...changes: ResourceChange[]
): RTE.ReaderTaskEither<UseCaseEnv, Error, void> =>
  publishRTE(() => changes.map(resourceChanged))(undefined);
