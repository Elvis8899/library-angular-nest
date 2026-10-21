import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { RealUserRepository } from "@modules/user/database/realUser.repository";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createRental } from "@test/util/createRental";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { resetDatabase } from "@test/util/resetDatabase";

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

  it("Should store an admin's empty CPF as NULL, so several admins can have none", async () => {
    //Given two admins without a CPF
    const admin = (index: number) =>
      new UserBuilder(index)
        .withEmail(`admin${String(index)}@example.com`)
        .withRole(UserRoleEnum.Admin)
        .withCPF("")
        .build();
    const first = admin(0);

    //When we save both
    await saveUser(first);
    await saveUser(admin(1));

    //Then both are stored without one, and read back with ""
    const stored = await prismaService.user.findMany({ select: { cpf: true } });
    expect(stored).toEqual([{ cpf: null }, { cpf: null }]);
    const read = await executeTask(userRepository.findById(first.id));
    expect(O.map((user: User) => user.cpf)(read)).toEqual(O.some(""));
  });

  // The commands check uniqueness first; these are writes that raced past it
  it("Should answer 409 user.emailTaken when another user has the email", async () => {
    await saveUser(new UserBuilder(0).withEmail("ana@example.com").build());

    const result = executeTask(
      userRepository.save(
        new UserBuilder(1)
          .withCPF("11144477735")
          .withEmail("Ana@Example.com")
          .build(),
      ),
    );

    await expect(result).rejects.toBeInstanceOf(
      UserEmailAlreadyExistsException,
    );
  });

  it("Should answer 409 user.cpfTaken when another user has the CPF", async () => {
    const cpf = new UserBuilder(0).build().cpf;
    await saveUser(new UserBuilder(0).build());

    const result = executeTask(
      userRepository.save(
        new UserBuilder(1).withEmail("other@example.com").withCPF(cpf).build(),
      ),
    );

    await expect(result).rejects.toBeInstanceOf(UserCPFAlreadyExistsException);
  });

  it("Should store emails in lowercase and find them whatever the case", async () => {
    const user = new UserBuilder(0).withEmail("Ana@Example.com").build();
    await saveUser(user);

    const stored = await prismaService.user.findUnique({
      where: { id: user.id },
    });
    const found = await executeTask(
      userRepository.findByEmail("ANA@example.COM"),
    );

    expect(stored?.email).toBe("ana@example.com");
    expect(O.map((u: User) => u.id)(found)).toEqual(O.some(user.id));
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
