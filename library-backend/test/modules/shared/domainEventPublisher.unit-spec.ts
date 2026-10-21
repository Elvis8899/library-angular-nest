import { InternalServerErrorException } from "@nestjs/common";
import { FPF } from "@shared/utils/application/monads";
import { BOOK_INFO_CREATED } from "@src/modules/book/domain/events/bookInfoCreated.event";
import { DomainEventPublisher } from "@src/modules/shared/domainEventPublisher/adapters/domainEventPublisher";
import { executeTask } from "@src/modules/shared/utils/application/executeTask";

let domainEvent: DomainEventPublisher;
const eventEmitter2Mock = {
  emit: jest.fn(() => true),
};
beforeEach(() => {
  domainEvent = new DomainEventPublisher(FPF.unsafeCoerce(eventEmitter2Mock));
});

describe("[Unit] DomainEventPublisher", () => {
  it("should be defined", () => {
    expect(domainEvent).toBeDefined();
  });

  it("should emit event", async () => {
    await executeTask(
      domainEvent.publishEvent({
        eventKey: BOOK_INFO_CREATED,
        payload: {
          id: "id",
          name: "name",
        },
      }),
    );
    expect(eventEmitter2Mock.emit).toHaveBeenCalled();
  });

  it("If emit fails, should get error", async () => {
    eventEmitter2Mock.emit.mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(
      executeTask(
        domainEvent.publishEvent({
          eventKey: BOOK_INFO_CREATED,
          payload: {
            id: "id",
            name: "name",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
