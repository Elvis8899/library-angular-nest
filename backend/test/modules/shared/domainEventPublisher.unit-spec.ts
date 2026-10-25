import { USER_DELETED } from "@modules/user/domain/events/userDeleted.event";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { FPF } from "@shared/utils/application/monads";
import { UnknownException } from "@shared/utils/domain/shared.errors";

let domainEvent: DomainEventPublisher;
const eventEmitter2Mock = {
  emitAsync: vi.fn(() => Promise.resolve([])),
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
    expect(eventEmitter2Mock.emitAsync).toHaveBeenCalled();
  });

  it("If emit fails, should get error", async () => {
    eventEmitter2Mock.emitAsync.mockImplementationOnce(() =>
      Promise.reject(new Error()),
    );
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
    ).rejects.toBeInstanceOf(UnknownException);
  });
});
