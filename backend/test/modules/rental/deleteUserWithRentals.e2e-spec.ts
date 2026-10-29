import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createRental } from "@test/modules/rental/createRental";
import { useE2eApp } from "@test/util/e2eApp";

// The user module's rule that rentals add: deleting a user would cascade to
// an unfinished rental and leave its book item rented

let userRepository: UserRepository;
const e2e = useE2eApp({
  authGuard: new MockAuthGuardBuilder(),
  resetEachTest: true,
});

beforeAll(() => {
  userRepository = e2e.get(UserRepository);
});

describe("[e2e] DELETE /v1/users/:id with rentals", () => {
  const v1Route = (userId: string) => "/v1/users/" + userId;

  it("Should respond 409 for a user with an unfinished rental", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));
    await createRental(e2e.prisma, user.id, RentalStatusEnum.Rented);

    const response = await e2e.http().delete(v1Route(user.id));

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body).toMatchObject({ code: "user.hasActiveRentals" });
    expect(await e2e.prisma.user.count()).toBe(1);
  });
});
