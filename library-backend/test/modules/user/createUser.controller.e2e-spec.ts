import { HttpStatus } from "@nestjs/common";
import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
const userBuilder = new UserBuilder(1);

const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
  userBuilder.reset();
});

describe("[e2e] POST /v1/users", () => {
  const v1Route = "/v1/users";

  it("Should respond 201 for a valid user", async () => {
    const user = userBuilder.withName("Test").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(user);
    expect(response.status).toBe(HttpStatus.CREATED);
  });

  it.each([
    { invalid: "an empty name", user: () => userBuilder.withName("") },
    {
      invalid: "a name that isn't a string",
      user: () => userBuilder.withName(FPF.unsafeCoerce(1)),
    },
    { invalid: "a short cpf", user: () => userBuilder.withCPF("12312") },
    {
      invalid: "a cpf with wrong check digits",
      user: () => userBuilder.withCPF("12345678901"),
    },
  ])("Should respond 422 for $invalid", async ({ user }) => {
    const response = await e2e
      .http()
      .post(v1Route)
      .send(user().buildCreateDTO());
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    const user = userBuilder.buildCreateDTO();
    const userCopy = user;
    const newuserResponse = await e2e.http().post(v1Route).send(user);
    expect(newuserResponse.status).toBe(HttpStatus.CREATED);
    const response = await e2e.http().post(v1Route).send(userCopy);
    expect(response.status).toBe(HttpStatus.CONFLICT);
  });
});
