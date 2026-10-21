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
    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid name", async () => {
    const user = userBuilder.withName("").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid cpf", async () => {
    const user = userBuilder.withCPF("12312").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for cpf with invalid check digits", async () => {
    const user = userBuilder.withCPF("12345678901").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const user = userBuilder.withName(FPF.unsafeCoerce(1)).buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    const user = userBuilder.buildCreateDTO();
    const userCopy = user;
    const newuserResponse = await e2e.http().post(v1Route).send(user);
    expect(newuserResponse.status).toBe(201);
    const response = await e2e.http().post(v1Route).send(userCopy);
    expect(response.status).toBe(409);
  });
});
