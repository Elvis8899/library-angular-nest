import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/executeTask";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { PinoLogger } from "nestjs-pino";
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import {
  DeleteUser,
  DeleteUserHandler,
} from "@src/modules/user/commands/deleteUser/deleteUser.command";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { FakeUserRepository } from "@src/modules/user/database/fakeUser.repository";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { UserNotFoundException } from "@src/modules/user/domain/user.errors";

//Adapters
let userRepository: UserRepository;
let eventModule: DomainEventPublisher;

describe("[Unit] Delete User", () => {
  let deleteUserHandler: DeleteUserHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventPublisherModule],
      providers: [
        { provide: DomainEventPublisherModule, useClass: DomainEventPublisher },
        DeleteUserHandler,
        RealUUIDGeneratorService,
        { provide: UserRepository, useClass: FakeUserRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    userRepository = moduleRef.get<UserRepository>(UserRepository);
    deleteUserHandler = moduleRef.get<DeleteUserHandler>(DeleteUserHandler);
    eventModule = moduleRef.get<DomainEventPublisher>(DomainEventPublisher);
  });

  it("Should delete user if id is valid", async () => {
    //Given a valid id

    const user = new UserBuilder().build();
    await executeTask(userRepository.save(user));
    const id = user.id;

    //When we delete a user
    const resultPromise = deleteUserHandler.execute(new DeleteUser(id));
    //Then it should have deleted a user
    await expect(resultPromise).resolves.toBe(undefined);
    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(0);
  });

  it("Should not delete user if id doesnt exists", async () => {
    //Given a valid id

    const user = new UserBuilder().build();
    await executeTask(userRepository.save(user));
    const newId = "00000000-0000-0000-0000-000000000000";

    //When we delete a user
    const resultPromise = deleteUserHandler.execute(new DeleteUser(newId));
    //Then it should not have deleted a user
    await expect(resultPromise).rejects.toBeInstanceOf(UserNotFoundException);
    const users = await executeTask(userRepository.findAll());
    expect(users.length).toEqual(1);
  });

  it("Should emit domain event when user is deleted", async () => {
    //Given a user

    const spy = jest.spyOn(eventModule, "publishEvent");

    const user = new UserBuilder().build();
    await executeTask(userRepository.save(user));
    const id = user.id;

    //When we delete a user
    await deleteUserHandler.execute(new DeleteUser(id));

    //Then it should have deleted a user and emitted an event
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
