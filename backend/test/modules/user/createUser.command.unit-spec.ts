import {
  CreateUser,
  CreateUserHandler,
} from "@modules/user/commands/createUser/createUser.command";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

const passwordHasher = new BcryptPasswordHasher();

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

    const spy = vi.spyOn(ctx.eventUser, "publishEvent");

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
    const cpf = user.cpf ?? "";
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

  it("Should not create a user with a short password", async () => {
    // Given a user whose password is too short
    const user = new UserBuilder().withPassword("123").buildCreateDTO();

    // When we create it
    const resultPromise = ctx.createUserHandler.execute(new CreateUser(user));

    // Then it is refused and nothing is stored
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    const users = await executeTask(ctx.userRepository.findAll());
    expect(users.length).toEqual(0);
  });

  it("Should store the password hashed", async () => {
    // Given a valid user
    const user = new UserBuilder().buildCreateDTO();

    // When we create it
    await ctx.createUserHandler.execute(new CreateUser(user));

    // Then the stored password is a hash of the one given
    const [stored] = await executeTask(ctx.userRepository.findAll());
    expect(stored?.password).not.toEqual(user.password);
    expect(
      await passwordHasher.matches(user.password, stored?.password ?? ""),
    ).toBe(true);
  });
});
