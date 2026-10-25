import {
  DeleteUser,
  DeleteUserHandler,
} from "@modules/user/commands/deleteUser/deleteUser.command";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserNotFoundException } from "@modules/user/domain/user.errors";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  RESOURCE_CHANGED,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Delete User", () => {
  const ctx = useHandlerModule({ providers: [DeleteUserHandler] }, (get) => ({
    userRepository: get(UserRepository),
    deleteUserHandler: get(DeleteUserHandler),
    eventModule: get(DomainEventPublisher),
  }));

  it("Should delete user if id is valid", async () => {
    //Given a valid id

    const user = new UserBuilder().build();
    await executeTask(ctx.userRepository.save(user));
    const id = user.id;

    //When we delete a user
    const resultPromise = ctx.deleteUserHandler.execute(new DeleteUser(id));
    //Then it should have deleted a user
    await expect(resultPromise).resolves.toBe(undefined);
    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(0);
  });

  it("Should not delete user if id doesnt exists", async () => {
    //Given a valid id

    const user = new UserBuilder().build();
    await executeTask(ctx.userRepository.save(user));
    const newId = "00000000-0000-0000-0000-000000000000";

    //When we delete a user
    const resultPromise = ctx.deleteUserHandler.execute(new DeleteUser(newId));
    //Then it should not have deleted a user
    await expect(resultPromise).rejects.toBeInstanceOf(UserNotFoundException);
    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should emit domain event when user is deleted", async () => {
    //Given a user

    const spy = vi.spyOn(ctx.eventModule, "publishEvent");

    const user = new UserBuilder().build();
    await executeTask(ctx.userRepository.save(user));
    const id = user.id;

    //When we delete a user
    await ctx.deleteUserHandler.execute(new DeleteUser(id));

    //Then it should have deleted a user and emitted an event
    // Its event, then the screens' reload
    expect(spy).toHaveBeenCalledTimes(2);
    expect(
      spy.mock.calls.slice(1).map(([event]) => ({
        resource: event.eventKey === RESOURCE_CHANGED && event.payload.resource,
      })),
    ).toEqual([{ resource: Resource.Users }]);
  });
});
