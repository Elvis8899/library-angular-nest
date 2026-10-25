import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEvent } from "@shared/domainEventPublisher/domainEvent";
import { FPF, TE } from "@shared/utils/application/monads";
import { validateWith } from "@shared/utils/application/validateWith";
import { unknownException } from "@shared/utils/domain/shared.errors";

@Injectable()
export class DomainEventPublisher {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Waits for the subscribers, so what they do is done when the request
   * answers. Their errors are logged by
   * @nestjs/event-emitter, not returned.
   */
  publishEvent = (domainEvent: DomainEvent): TE.TaskEither<Error, void> =>
    FPF.pipe(
      domainEvent,
      validateWith(DomainEvent, "DomainEvent"),
      TE.fromEither,
      TE.chainW((event) =>
        TE.tryCatch(
          () => this.eventEmitter.emitAsync(event.eventKey, event.payload),
          unknownException,
        ),
      ),
      TE.asUnit,
    );
}
