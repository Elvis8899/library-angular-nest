import { USER_DELETED } from "@modules/user/domain/events/userDeleted.event";
import { InternalServerErrorException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { FPF } from "@shared/utils/application/monads";

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
        eventKey: USER_DELETED,
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
          eventKey: USER_DELETED,
          payload: {
            id: "id",
            name: "name",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
