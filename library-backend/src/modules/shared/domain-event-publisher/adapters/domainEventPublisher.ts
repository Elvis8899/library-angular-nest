import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEvent } from "@shared/domain-event-publisher/domain/domainEvent";
import { E, FPF, TE } from "@shared/functional/monads";
import { unknownException } from "@shared/utils/unknownException";
import { validateWith } from "@shared/utils/validateWith";

@Injectable()
export class DomainEventPublisher {
  constructor(private eventEmitter: EventEmitter2) {}

  publishEvent = (domainEvent: DomainEvent): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      domainEvent,
      validateWith(DomainEvent, "DomainEvent"),
      TE.fromEither,
      TE.chainEitherK(
        E.tryCatchK((event: DomainEvent) => {
          this.eventEmitter.emit(event.eventKey, event.payload);
        }, unknownException),
      ),
    );
  };
}
