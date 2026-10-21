import { HttpStatus } from "@nestjs/common";
import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

import { comparePassword } from "@auth/utils/password";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { UserRepository } from "@user/database/user.repository.port";
import { UserRoleEnum } from "@user/domain/user.entity";
let userRepository: UserRepository;
const userBuilder = new UserBuilder();
const originalUser = userBuilder.withName("Test").build();

const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(() => {
  userRepository = e2e.get(UserRepository);
});

beforeEach(async () => {
  await resetDatabase(e2e.prisma);

  userBuilder.reset();
  await executeTask(userRepository.save(originalUser));
});

describe("[e2e] PUT /v1/users/{userId}", () => {
  const v1Route = (id: string) => "/v1/users/" + id;
  it("Should respond 200 updated for a valid user", async () => {
    const userDTO = userBuilder.buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(HttpStatus.OK);
  });

  it("Should persist every updated field", async () => {
    // Given new values for all editable fields
    const userDTO = userBuilder
      .withName("Updated Name")
      .withEmail("updated@example.com")
      .withCPF("11144477735")
      .withPassword("new-password-123")
      .buildCreateDTO();

    // When the user is updated
    const response = await e2e
      .http()
      .put(v1Route(originalUser.id))
      .send(userDTO);

    // Then all of them are stored, with the new password hashed
    expect(response.status).toBe(HttpStatus.OK);
    const stored = await e2e.prisma.user.findUnique({
      where: { id: originalUser.id },
    });
    expect(stored).toMatchObject({
      name: "Updated Name",
      email: "updated@example.com",
      cpf: "111.444.777-35",
    });
    expect(
      await comparePassword("new-password-123", stored?.password ?? ""),
    ).toBe(true);
  });

  it.each([
    { invalid: "an empty name", user: () => userBuilder.withName("") },
    {
      invalid: "a name that isn't a string",
      user: () => userBuilder.withName(FPF.unsafeCoerce(1)),
    },
    {
      invalid: "a cpf with wrong check digits",
      user: () => userBuilder.withCPF("12345678901"),
    },
  ])("Should respond 422 for $invalid", async ({ user }) => {
    const response = await e2e
      .http()
      .put(v1Route(originalUser.id))
      .send(user().buildCreateDTO());
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    // With User Saved with cpf to repeat
    const user = new UserBuilder(2)
      .withCPF("11144477735")
      .withEmail("usertwo@example.com")
      .withRole(UserRoleEnum.Client)
      .build();
    await executeTask(userRepository.save(user));

    const repeatCPF = user.cpf;

    const userDTO = userBuilder
      .withRole(UserRoleEnum.Client)
      .withCPF(repeatCPF)
      .buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(HttpStatus.CONFLICT);
  });
});
