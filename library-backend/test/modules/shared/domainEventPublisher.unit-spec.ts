import { InternalServerErrorException } from "@nestjs/common";
import { BOOK_INFO_CREATED } from "@src/modules/book/domain/events/bookInfoCreated.event";
import { DomainEventPublisher } from "@src/modules/shared/domain-event-publisher/adapters/domainEventPublisher";
import { executeTask } from "@src/modules/shared/utils/application/executeTask";
import { unsafeCoerce } from "fp-ts/lib/function";

let domainEvent: DomainEventPublisher;
const eventEmitter2Mock = {
  emit: jest.fn(() => true),
};
beforeEach(() => {
  domainEvent = new DomainEventPublisher(unsafeCoerce(eventEmitter2Mock));
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
