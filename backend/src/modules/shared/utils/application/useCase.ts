import { Inject, Injectable, Optional, Scope } from "@nestjs/common";
import { INQUIRER } from "@nestjs/core";
import { auditEntryOf, NewAuditEntry } from "@shared/audit/auditEntry";
import { AuditLog } from "@shared/audit/auditLog";
import { currentRequesterId } from "@shared/audit/requester";
import { DomainEvent } from "@shared/domainEventPublisher/domainEvent";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  ResourceChange,
  resourceChanged,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { Metrics, outcomeOf } from "@shared/metrics/metrics";
import { executeTask } from "@shared/utils/application/executeTask";
import { E, FPF, RTE, TE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { PinoLogger } from "nestjs-pino";

/** What a handler's pipeline reads: the logger and the event publisher. */
export type UseCaseEnv = {
  logger: PinoLogger;
  events: DomainEventPublisher;
};

// What @CommandHandler marks its class with (@nestjs/cqrs's
// COMMAND_HANDLER_METADATA, not exported)
const COMMAND_HANDLER_METADATA = "__commandHandler__";

/**
 * Runs a command or query handler's pipeline: logs the request under the
 * handler's name and turns the task into the Promise Nest expects. A
 * command that succeeds is audited: who asked, the handler's name and what
 * it logs of the input, after its transaction (an entry that fails to be
 * written is logged, the command still answers). Each run is timed, with
 * its outcome, for the metrics. Transient, so each handler
 * gets its own logger and context, and knows whose it is.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class UseCase {
  private readonly audited: boolean;

  constructor(
    private readonly logger: PinoLogger,
    private readonly events: DomainEventPublisher,
    private readonly auditLog: AuditLog,
    private readonly metrics: Metrics,
    // The handler it runs for; none when built outside one
    @Optional() @Inject(INQUIRER) handler?: object,
  ) {
    this.audited =
      handler !== undefined &&
      Reflect.hasMetadata(COMMAND_HANDLER_METADATA, handler.constructor);
  }

  /**
   * @param input what is logged with the request, and a command's audit
   * entry keeps; leave out secrets (passwords, tokens), or pass undefined to
   * log none
   */
  run<A>(
    name: string,
    input: unknown,
    task: RTE.ReaderTaskEither<UseCaseEnv, Error, A>,
  ): Promise<A> {
    this.logger.setContext(name);
    if (input === undefined) this.logger.info(`${name} received`);
    else this.logger.info(input, `${name} received`);
    const requesterId = currentRequesterId();
    const end = this.metrics.startUseCase(name);
    const timed = FPF.pipe(
      task({ logger: this.logger, events: this.events }),
      TE.tap((result) =>
        this.audited
          ? this.audit(auditEntryOf(name, input, result, requesterId))
          : TE.right(undefined),
      ),
    );
    return executeTask(async () => {
      const result = await timed();
      end(E.isRight(result) ? "ok" : outcomeOf(result.left));
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
        RTE.traverseSeqArray((event) =>
          performRTE(
            events.publishEvent,
            `publish ${event.eventKey} event`,
          )(event),
        ),
        RTE.asUnit,
      );
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
