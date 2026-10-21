import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useHandlerModule } from "@test/util/handlerModule";
import {
  CreateUser,
  CreateUserHandler,
} from "@user/commands/createUser/createUser.command";
import { UserRepository } from "@user/database/user.repository.port";
import { UserRoleEnum } from "@user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
} from "@user/domain/user.errors";

//Adapters

describe("[Unit] Create User", () => {
  const ctx = useHandlerModule({ providers: [CreateUserHandler] }, (get) => ({
    userRepository: get(UserRepository),
    createUserHandler: get(CreateUserHandler),
    eventUser: get(DomainEventPublisher),
  }));

  it("Should create user if user is valid", async () => {
    //Given a potentially valid user
    const user = new UserBuilder().buildCreateDTO();

    //When we create a user
    const resultPromise = ctx.createUserHandler.execute(new CreateUser(user));

    //Then it should have created a user
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should create user without optional keys", async () => {
    //Given a potentially valid name

    const user = new UserBuilder()
      .withRole(UserRoleEnum.Admin)
      .withCPF("")
      .buildCreateDTO();
    //When we create a user
    const resultPromise = ctx.createUserHandler.execute(new CreateUser(user));

    //Then it should have created a user
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should emit domain event when user is created", async () => {
    //Given a potentially valid name

    const spy = jest.spyOn(ctx.eventUser, "publishEvent");

    const user = new UserBuilder().buildCreateDTO();
    //When we create a user
    await ctx.createUserHandler.execute(new CreateUser(user));

    //Then it should have created a user and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not create a user if name is invalid", async () => {
    //Given a potentially invalid name
    const user = new UserBuilder().withCPF("").buildCreateDTO();
    //When we create a user
    const resultPromise = ctx.createUserHandler.execute(new CreateUser(user));

    //Then it should have thrown an error and not have created a user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(0);
  });

  it("Should not create a user if the email already exists, whatever its case", async () => {
    //Given an existing user
    const user = new UserBuilder().buildCreateDTO();
    await ctx.createUserHandler.execute(new CreateUser(user));
    //When another user signs up with the same email in capitals
    const other = new UserBuilder(1)
      .withCPF("11144477735")
      .withEmail(user.email.toUpperCase())
      .buildCreateDTO();
    const resultPromise = ctx.createUserHandler.execute(new CreateUser(other));
    //Then the email is taken, not the CPF
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserEmailAlreadyExistsException,
    );
  });

  it("Should store the email in lowercase", async () => {
    const user = new UserBuilder()
      .withEmail("Ana@Example.com")
      .buildCreateDTO();

    await ctx.createUserHandler.execute(new CreateUser(user));

    const [stored] = await executeTask(ctx.userRepository.findAll());
    expect(stored?.email).toBe("ana@example.com");
  });

  it("Should not create a user if cpf already exists", async () => {
    //Given an existing user
    const user = new UserBuilder().buildCreateDTO();
    const cpf = user.cpf;
    //When we create two users with the same name
    await ctx.createUserHandler.execute(new CreateUser(user));
    const userCopy = new UserBuilder().withCPF(cpf).buildCreateDTO();
    const resultPromise = ctx.createUserHandler.execute(
      new CreateUser(userCopy),
    );
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserCPFAlreadyExistsException,
    );
  });
});
