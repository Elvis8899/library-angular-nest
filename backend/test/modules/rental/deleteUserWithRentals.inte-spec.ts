import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { RealUserRepository } from "@modules/user/database/realUser.repository";
import { User } from "@modules/user/domain/user.entity";
import { UserHasActiveRentalsException } from "@modules/user/domain/user.errors";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createRental } from "@test/modules/rental/createRental";
import { resetDatabase } from "@test/util/resetDatabase";

// The user repository's rule that rentals add: deleteById refuses a user
// with an unfinished rental, and cascades to the finished ones

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

describe("[Integration] User repository with rentals", () => {
  const userBuilder = new UserBuilder();

  const saveUser = (p: User) => executeTask(userRepository.save(p));

  beforeEach(async () => {
    await resetDatabase(prismaService);
  });

  afterEach(() => {
    userBuilder.reset();
  });

  it("Should not delete user with an unfinished rental", async () => {
    //Given a user renting a book
    const user = userBuilder.build();
    await saveUser(user);
    await createRental(prismaService, user.id, RentalStatusEnum.Rented);

    //When we try deleting him
    const resultPromise = executeTask(userRepository.deleteById(user.id));

    //Then he and his rental should remain, or the book item would stay rented
    await expect(resultPromise).rejects.toBeInstanceOf(
      UserHasActiveRentalsException,
    );
    expect(
      await Promise.all([
        prismaService.user.count(),
        prismaService.bookRentalDetails.count(),
      ]),
    ).toEqual([1, 1]);
  });

  it("Successfully delete user whose rentals are finished", async () => {
    //Given a user who returned a book
    const user = userBuilder.build();
    await saveUser(user);
    await createRental(prismaService, user.id, RentalStatusEnum.Finished);

    //When we delete him
    await executeTask(userRepository.deleteById(user.id));

    //Then he and his rental history should be deleted
    expect(
      await Promise.all([
        prismaService.user.count(),
        prismaService.bookRentalDetails.count(),
      ]),
    ).toEqual([0, 0]);
  });
});
