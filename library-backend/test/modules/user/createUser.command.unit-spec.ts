import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createHandlerModule } from "@test/util/handlerModule";
import {
  CreateUser,
  CreateUserHandler,
} from "@user/commands/createUser/createUser.command";
import { UserRepository } from "@user/database/user.repository.port";
import { UserRoleEnum } from "@user/domain/user.entity";
import { UserCPFAlreadyExistsException } from "@user/domain/user.errors";

//Adapters
let userRepository: UserRepository;
let eventUser: DomainEventPublisher;

describe("[Unit] Create User", () => {
  let createUserHandler: CreateUserHandler;

  beforeEach(async () => {
    const moduleRef = await createHandlerModule([CreateUserHandler]);

    userRepository = moduleRef.get<UserRepository>(UserRepository);
    createUserHandler = moduleRef.get<CreateUserHandler>(CreateUserHandler);
    eventUser = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);
  });

  it("Should create user if user is valid", async () => {
    //Given a potentially valid user
    const user = new UserBuilder().buildCreateDTO();

    //When we create a user
    const resultPromise = createUserHandler.execute(new CreateUser(user));

    //Then it should have created a user
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should create user without optional keys", async () => {
    //Given a potentially valid name

    const user = new UserBuilder()
      .withRole(UserRoleEnum.Admin)
      .withCPF("")
      .buildCreateDTO();
    //When we create a user
    const resultPromise = createUserHandler.execute(new CreateUser(user));

    //Then it should have created a user
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should emit domain event when user is created", async () => {
    //Given a potentially valid name

    const spy = jest.spyOn(eventUser, "publishEvent");

    const user = new UserBuilder().buildCreateDTO();
    //When we create a user
    await createUserHandler.execute(new CreateUser(user));

    //Then it should have created a user and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not create a user if name is invalid", async () => {
    //Given a potentially invalid name
    const user = new UserBuilder().withCPF("").buildCreateDTO();
    //When we create a user
    const resultPromise = createUserHandler.execute(new CreateUser(user));

    //Then it should have thrown an error and not have created a user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(0);
  });

  it("Should not create a user if cpf already exists", async () => {
    //Given an existing user
    const user = new UserBuilder().buildCreateDTO();
    const cpf = user.cpf;
    //When we create two users with the same name
    await createUserHandler.execute(new CreateUser(user));
    const userCopy = new UserBuilder().withCPF(cpf).buildCreateDTO();
    const resultPromise = createUserHandler.execute(new CreateUser(userCopy));
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserCPFAlreadyExistsException,
    );
  });
});
