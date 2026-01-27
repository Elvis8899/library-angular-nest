import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/executeTask";
import { InternalServerErrorException } from "@nestjs/common";
import { O } from "@shared/functional/monads";
import { RealUserRepository } from "@src/modules/user/database/realUser.repository";
import { User, UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

let prismaService: PrismaService;
let userRepository: RealUserRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealUserRepository, PrismaService],
  }).compile();

  userRepository = module.get<RealUserRepository>(RealUserRepository);
  prismaService = module.get<PrismaService>(PrismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] User repository", () => {
  const userBuilder = new UserBuilder();
  const allBuilders = [userBuilder];

  const saveUser = (p: User) => executeTask(userRepository.save(p));

  beforeEach(async () => {
    await prismaService.user.deleteMany();
  });

  afterEach(async () => {
    await prismaService.user.deleteMany();
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

    const { createdAt, updatedAt, ...userToCompare } = user;

    return expect(savedUser).toMatchObject(O.some(userToCompare));
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
    return expect(savedUser).toMatchObject(O.none);
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

    return expect(savedUser).toMatchObject({
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

    const { createdAt, updatedAt, ...userToCompare } = user;

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

    // const countRelatedTables = await Promise.all([
    //   prismaService.bookRental.count(),
    // ]);
    // return expect(countRelatedTables).toEqual([0, 0, 0, 0]);
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
    await expect(resultPromise).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    const savedUsers = await prismaService.user.findMany({});

    return expect(savedUsers.length).toBe(1);
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

    return expect(savedUser?.id).toBe(user.id);
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
});
