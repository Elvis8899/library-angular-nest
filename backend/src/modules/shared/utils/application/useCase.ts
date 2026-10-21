import { Injectable, Scope } from "@nestjs/common";
import { DomainEvent } from "@shared/domainEventPublisher/domainEvent";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { PinoLogger } from "nestjs-pino";

/** What a handler's pipeline reads: the logger and the event publisher. */
export type UseCaseEnv = {
  logger: PinoLogger;
  events: DomainEventPublisher;
};

/**
 * Runs a command or query handler's pipeline: logs the request under the
 * handler's name and turns the task into the Promise Nest expects.
 * Transient, so each handler gets its own logger and context.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class UseCase {
  constructor(
    private readonly logger: PinoLogger,
    private readonly events: DomainEventPublisher,
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
    return executeTask(task({ logger: this.logger, events: this.events }));
  }
}

/**
 * Publishes the event built from the pipeline's value, which it keeps:
 * `RTE.tap(publishRTE(userCreated))`.
 */
export const publishRTE =
  <A>(toEvent: (data: A) => DomainEvent) =>
  (data: A): RTE.ReaderTaskEither<UseCaseEnv, Error, void> =>
    RTE.asksReaderTaskEither(({ events }) => {
      const event = toEvent(data);
      return performRTE(
        events.publishEvent,
        `publish ${event.eventKey} event`,
      )(event);
    });
