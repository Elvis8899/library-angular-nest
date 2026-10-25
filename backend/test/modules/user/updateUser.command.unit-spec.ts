import {
  UpdateUser,
  UpdateUserHandler,
} from "@modules/user/commands/updateUser/updateUser.command";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
  UserNotFoundException,
} from "@modules/user/domain/user.errors";
import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  RESOURCE_CHANGED,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] Update User", () => {
  const userBuilder = new UserBuilder(1);
  let originalUserId: string;

  const ctx = useHandlerModule({ providers: [UpdateUserHandler] }, (get) => ({
    userRepository: get(UserRepository),
    updateUserHandler: get(UpdateUserHandler),
    eventUser: get(DomainEventPublisher),
  }));

  beforeEach(async () => {
    userBuilder.reset();
    const originalUser = userBuilder.build();
    originalUserId = originalUser.id;
    await executeTask(ctx.userRepository.save(originalUser));
  });

  it("Should update user if user is valid", async () => {
    // Given a potentially valid user
    const userDTO = userBuilder.buildCreateDTO();

    //When we update it
    const resultPromise = ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(1);
    //And revoked the user's existing refresh tokens
    expect(users[0]?.tokenVersion).toEqual(1);
  });

  it("Should update user without optional keys", async () => {
    //Given a potentially valid user
    const userDTO = userBuilder.withRole(UserRoleEnum.Admin).buildCreateDTO();

    //When we update it without optional keys
    userDTO.cpf = "";
    const resultPromise = ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have updated the user
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should emit domain event when user is updated", async () => {
    //Given a potentially valid user
    const userDTO = userBuilder.buildCreateDTO();

    const spy = vi.spyOn(ctx.eventUser, "publishEvent");

    //When we update the user
    await ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have updated the user and emitted an event
    // Its event, then the screens' reload
    expect(spy).toHaveBeenCalledTimes(2);
    expect(
      spy.mock.calls.slice(1).map(([event]) => ({
        resource: event.eventKey === RESOURCE_CHANGED && event.payload.resource,
      })),
    ).toEqual([{ resource: Resource.Users }]);
  });

  it("Should not update an user if it doesn't exist", async () => {
    // Given a potentially valid user
    const userDTO = userBuilder.buildCreateDTO();

    // And an invalid id
    const invalidUserId = "c017f4a9-c458-4ea7-829c-021c6a608503";

    //When we update the user with an id that doesn't exist
    const resultPromise = ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, invalidUserId),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("Should not update an user if name is invalid", async () => {
    // Given a user with an invalid name
    const userDTO = userBuilder.withName("").buildCreateDTO();

    //When we update the user
    const resultPromise = ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should not update an user if cpf already exists", async () => {
    // Given another user with a CPF of their own
    const other = new UserBuilder(2)
      .withEmail("usertwo@example.com")
      .withCPF("11144477735")
      .build();
    await executeTask(ctx.userRepository.save(other));

    //When we update the user to have the other's CPF
    const userDTO = userBuilder.withCPF(other.cpf).buildCreateDTO();
    const resultPromise = ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, userBuilder.build().id),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserCPFAlreadyExistsException,
    );
  });

  it("Should not update an user if email already exists", async () => {
    // Given a potentially valid name
    // When an user with the same name exists
    const secondUserBuilder = new UserBuilder(2)
      .withCPF("11144477735")
      .withEmail("usertwo@example.com");
    const secondUser = secondUserBuilder.build();
    const repeatEmail = userBuilder.build().email;
    await executeTask(ctx.userRepository.save(secondUser));

    //When we update the user to have same name
    const userDTO = secondUserBuilder.withEmail(repeatEmail).buildCreateDTO();
    const resultPromise = ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, secondUser.id),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserEmailAlreadyExistsException,
    );
  });

  it("Should keep the password and sessions when only the name changes", async () => {
    // Given an update without a password, changing only the name
    const { password: _, ...userDTO } = userBuilder
      .withName("Outro Nome")
      .buildCreateDTO();

    // When we update the user
    await ctx.updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    // Then the name changed, the password and the sessions didn't
    const users = await executeTask(ctx.userRepository.findAll());
    expect(users[0]).toMatchObject({
      name: "Outro Nome",
      password: userBuilder.build().password,
      tokenVersion: 0,
    });
  });
});
