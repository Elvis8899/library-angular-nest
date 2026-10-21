import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createRental } from "@test/util/createRental";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { resetDatabase } from "@test/util/resetDatabase";
import { RealUserRepository } from "@user/database/realUser.repository";
import { User, UserRoleEnum } from "@user/domain/user.entity";

let prismaService: PrismaService;
let userRepository: RealUserRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealUserRepository, PrismaService],
  }).compile();

  userRepository = module.get(RealUserRepository);
  prismaService = module.get(PrismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] User repository", () => {
  const userBuilder = new UserBuilder();
  const allBuilders = [userBuilder];

  const saveUser = (p: User) => executeTask(userRepository.save(p));

  beforeEach(async () => {
    await resetDatabase(prismaService);
  });

  afterEach(() => {
    allBuilders.map((builder) => builder.reset());
  });

  it("Successfully get user by cpf", async () => {
    //Given an existing user in database
    const cpf = "12345678901";

    const user = userBuilder.withRole(UserRoleEnum.Client).withCPF(cpf).build();

    await executeTask(userRepository.save(user));
    //When we retrieve him by name
    const savedUser = await executeTask(userRepository.findByCPF(cpf));

    //Then we should have retrieved him

    const { createdAt: _, updatedAt: __, ...userToCompare } = user;

    expect(savedUser).toMatchObject(O.some(userToCompare));
  });

  it("Fails to get user by cpf", async () => {
    //Given an existing user in database
    const cpf = "12345678901";
    const user = userBuilder.withCPF(cpf).build();
    await executeTask(userRepository.save(user));
    // When we retrieve him by another cpf
    const fakeCpf = "12345678902";
    //When we retrieve him by name
    const savedUser = await executeTask(userRepository.findByCPF(fakeCpf));

    //Then we should have retrieved none
    expect(savedUser).toMatchObject(O.none);
  });

  it.each([
    ["admin", userBuilder.withRole(UserRoleEnum.Admin).build()],
    ["client", userBuilder.build()],
  ])("Successfully save %s", async (_: string, user: User) => {
    //Given an inexisting user in database

    //When we save him
    await saveUser(user);

    //Then we should have saved him
    const savedUser = await prismaService.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(savedUser).toMatchObject({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  });

  it.each([
    ["admin", userBuilder.withRole(UserRoleEnum.Admin).build()],
    ["client", userBuilder.build()],
  ])("Successfully get %s after save", async (_: string, user: User) => {
    //Given an inexisting user in database

    //When we save him
    await saveUser(user);

    // Should be able to retrieve it
    const [resultById, resultByEmail, resultPaginated, resultAll] =
      await Promise.all([
        executeTask(userRepository.findById(user.id)),
        executeTask(userRepository.findByEmail(user.email)),
        executeTask(
          userRepository.findAllPaginated({ page: 0, limit: 10, offset: 0 }),
        ),
        executeTask(userRepository.findAll()),
      ]);

    const { createdAt: ___, updatedAt: __, ...userToCompare } = user;

    expect(resultById).toMatchObject(O.some(userToCompare));
    expect(resultByEmail).toMatchObject(O.some(userToCompare));
    expect(resultPaginated.count).toBe(1);
    expect(resultPaginated.data.length).toBe(1);
    expect(resultAll.length).toBe(1);
  });

  it("Successfully delete user after save", async () => {
    //Given an inexisting user in database
    const user = userBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(userRepository.save(user));

    //When we delete him

    await executeTask(userRepository.deleteById(user.id));
    //Then we should have deleted him
    const savedUsers = await prismaService.user.findMany({});

    expect(savedUsers.length).toBe(0);
  });

  it("Should not delete user with wrong id", async () => {
    //Given an inexisting user in database
    const user = userBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    await executeTask(userRepository.save(user));

    const unsavedUser = userBuilder.reset().build();

    //When we try deleting an unsaved user

    const resultPromise = executeTask(
      userRepository.deleteById(unsavedUser.id),
    );
    //Then we should not have deleted him
    await expect(resultPromise).rejects.toBeInstanceOf(NotFoundException);
    const savedUsers = await prismaService.user.findMany({});

    expect(savedUsers.length).toBe(1);
  });

  it("Should not delete user with an unfinished rental", async () => {
    //Given a user renting a book
    const user = userBuilder.build();
    await saveUser(user);
    await createRental(prismaService, user.id, RentalStatusEnum.Rented);

    //When we try deleting him
    const resultPromise = executeTask(userRepository.deleteById(user.id));

    //Then he and his rental should remain, or the book item would stay rented
    await expect(resultPromise).rejects.toBeInstanceOf(ConflictException);
    expect(await prismaService.user.count()).toBe(1);
    expect(await prismaService.bookRentalDetails.count()).toBe(1);
  });

  it("Successfully delete user whose rentals are finished", async () => {
    //Given a user who returned a book
    const user = userBuilder.build();
    await saveUser(user);
    await createRental(prismaService, user.id, RentalStatusEnum.Finished);

    //When we delete him
    await executeTask(userRepository.deleteById(user.id));

    //Then he and his rental history should be deleted
    expect(await prismaService.user.count()).toBe(0);
    expect(await prismaService.bookRentalDetails.count()).toBe(0);
  });

  it("Successfully save admin without cpf", async () => {
    //Given an inexisting user in database
    const user = userBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .withRole(UserRoleEnum.Admin)
      .build();

    user.cpf = "";

    await executeTask(userRepository.save(user));

    const savedUser = await prismaService.user.findUnique({
      where: {
        id: createTestId(TableNameEnum.None, 0),
      },
    });

    expect(savedUser?.id).toBe(user.id);
  });

  it("Return null when there is no user", async () => {
    //Given no existing users in database
    const unsaveUser = userBuilder
      .withId(createTestId(TableNameEnum.None, 0))
      .build();

    //When we try to retrieve
    const [resultById, resultByName, resultPaginated, resultAll] =
      await Promise.all([
        executeTask(userRepository.findById(unsaveUser.id)),
        executeTask(userRepository.findByCPF(unsaveUser.cpf)),
        executeTask(
          userRepository.findAllPaginated({ page: 0, limit: 10, offset: 0 }),
        ),
        executeTask(userRepository.findAll()),
      ]);

    expect(resultById).toMatchObject(O.none);
    expect(resultByName).toMatchObject(O.none);
    expect(resultPaginated.count).toBe(0);
    expect(resultPaginated.data.length).toBe(0);
    expect(resultAll.length).toBe(0);
  });

  it("Successfully increment token version", async () => {
    const user = userBuilder.build();
    await executeTask(userRepository.save(user));

    await executeTask(userRepository.incrementTokenVersion(user.id));

    const stored = await prismaService.user.findUnique({
      where: { id: user.id },
    });
    expect(stored?.tokenVersion).toBe(user.tokenVersion + 1);
  });

  it("Ignores token version increment for unknown user", async () => {
    await expect(
      executeTask(
        userRepository.incrementTokenVersion(
          createTestId(TableNameEnum.User, 9),
        ),
      ),
    ).resolves.toBeUndefined();
  });
});
