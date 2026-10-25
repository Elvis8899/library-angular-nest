import { Injectable, Scope } from "@nestjs/common";
import { DomainEvent } from "@shared/domainEventPublisher/domainEvent";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { Metrics, outcomeOf } from "@shared/metrics/metrics";
import { executeTask } from "@shared/utils/application/executeTask";
import { E, FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { PinoLogger } from "nestjs-pino";

/** What a handler's pipeline reads: the logger and the event publisher. */
export type UseCaseEnv = {
  logger: PinoLogger;
  events: DomainEventPublisher;
};

/**
 * Runs a command or query handler's pipeline: logs the request under the
 * handler's name and turns the task into the Promise Nest expects. Each run
 * is timed, with its outcome, for the metrics. Transient, so each handler
 * gets its own logger and context.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class UseCase {
  constructor(
    private readonly logger: PinoLogger,
    private readonly events: DomainEventPublisher,
    private readonly metrics: Metrics,
  ) {}

  /**
   * @param input what is logged with the request; leave out secrets
   * (passwords, tokens), or pass undefined to log none
   */
  run<A>(
    name: string,
    input: unknown,
    task: RTE.ReaderTaskEither<UseCaseEnv, Error, A>,
  ): Promise<A> {
    this.logger.setContext(name);
    if (input === undefined) this.logger.info(`${name} received`);
    else this.logger.info(input, `${name} received`);
    const end = this.metrics.startUseCase(name);
    const run = task({ logger: this.logger, events: this.events });
    return executeTask(async () => {
      const result = await run();
      end(E.isRight(result) ? "ok" : outcomeOf(result.left));
      return result;
    });
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
        RTE.traverseSeqArray((event) =>
          performRTE(
            events.publishEvent,
            `publish ${event.eventKey} event`,
          )(event),
        ),
        RTE.asUnit,
      );
    });
