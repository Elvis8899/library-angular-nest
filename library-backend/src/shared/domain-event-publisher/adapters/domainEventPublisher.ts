import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { E, FPF, TE } from "@shared/functional/monads";
import { DomainEvent } from "@shared/domain-event-publisher/domain/domainEvent";
import { validateWith } from "@src/shared/utils/validateWith";
import { unknownException } from "@src/shared/utils/unknownException";

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
