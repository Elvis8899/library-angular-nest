import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEvent } from "@shared/domainEventPublisher/domain/domainEvent";
import { E, FPF, TE } from "@shared/utils/application/monads";
import { validateWith } from "@shared/utils/application/validateWith";
import { unknownException } from "@shared/utils/domain/shared.erros";

@Injectable()
export class DomainEventPublisher {
  constructor(private eventEmitter: EventEmitter2) {}

  publishEvent = (domainEvent: DomainEvent): TE.TaskEither<Error, void> =>
    FPF.pipe(
      domainEvent,
      validateWith(DomainEvent, "DomainEvent"),
      TE.fromEither,
      TE.chainEitherKW(
        E.tryCatchK((event: DomainEvent) => {
          this.eventEmitter.emit(event.eventKey, event.payload);
        }, unknownException),
      ),
    );
}
