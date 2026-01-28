import { UnprocessableEntityException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { PinoLogger } from "nestjs-pino";
import {
  UpdateUser,
  UpdateUserHandler,
} from "@src/modules/user/commands/updateUser/updateUser.command";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import { FakeUserRepository } from "@src/modules/user/database/fakeUser.repository";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
  UserNotFoundException,
} from "@src/modules/user/domain/user.errors";

//Adapters
let userRepository: UserRepository;
let eventUser: DomainEventPublisher;

describe("[Unit] Update User", () => {
  let updateUserHandler: UpdateUserHandler;

  const userBuilder = new UserBuilder(1);
  let originalUserId: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        {
          provide: DomainEventPublisherModule,
          useClass: DomainEventPublisher,
        },
        UpdateUserHandler,
        RealUUIDGeneratorService,
        { provide: UserRepository, useClass: FakeUserRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    userRepository = moduleRef.get<UserRepository>(UserRepository);
    updateUserHandler = moduleRef.get<UpdateUserHandler>(UpdateUserHandler);
    eventUser = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);

    userBuilder.reset();
    const originalUser = userBuilder.build();
    originalUserId = originalUser.id;
    await executeTask(userRepository.save(originalUser));
  });

  it("Should update user if user is valid", async () => {
    // Given a potentially valid user
    const userDTO = userBuilder.buildCreateDTO();

    //When we update it
    const resultPromise = updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have suscessfully updated
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should update user without optional keys", async () => {
    //Given a potentially valid user
    const userDTO = userBuilder.withRole(UserRoleEnum.Admin).buildCreateDTO();

    //When we update it without optional keys
    userDTO.cpf = "";
    const resultPromise = updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have updated the user
    await expect(resultPromise).resolves.toEqual(undefined);

    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should emit domain event when user is updated", async () => {
    //Given a potentially valid user
    const userDTO = userBuilder.buildCreateDTO();

    const spy = jest.spyOn(eventUser, "publishEvent");

    //When we update the user
    await updateUserHandler.execute(new UpdateUser(userDTO, originalUserId));

    //Then it should have updated the user and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("Should not update an user if it doesn't exist", async () => {
    // Given a potentially valid user
    const userDTO = userBuilder.buildCreateDTO();

    // And an invalid id
    const invalidUserId = "c017f4a9-c458-4ea7-829c-021c6a608503";

    //When we update the user with an id that doesn't exist
    const resultPromise = updateUserHandler.execute(
      new UpdateUser(userDTO, invalidUserId),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("Should not update an user if name is invalid", async () => {
    // Given a user with an invalid name
    const userDTO = userBuilder.withName("").buildCreateDTO();

    //When we update the user
    const resultPromise = updateUserHandler.execute(
      new UpdateUser(userDTO, originalUserId),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should not update an user if cpf already exists", async () => {
    // Given a potentially valid name
    // When an user with the same name exists
    const user = new UserBuilder(2).build();

    const repeatCPF = user.cpf;
    await executeTask(userRepository.save(user));

    //When we update the user to have same name
    const userDTO = userBuilder.withCPF(repeatCPF).buildCreateDTO();
    const resultPromise = updateUserHandler.execute(
      new UpdateUser(userDTO, user.id),
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
      .withCPF("12345678902")
      .withEmail("usertwo@example.com");
    const secondUser = secondUserBuilder.build();
    const repeatEmail = userBuilder.build().email;
    await executeTask(userRepository.save(secondUser));

    //When we update the user to have same name
    const userDTO = secondUserBuilder.withEmail(repeatEmail).buildCreateDTO();
    const resultPromise = updateUserHandler.execute(
      new UpdateUser(userDTO, secondUser.id),
    );

    //Then it should have thrown an error and not have updated the user
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserEmailAlreadyExistsException,
    );
  });
});
