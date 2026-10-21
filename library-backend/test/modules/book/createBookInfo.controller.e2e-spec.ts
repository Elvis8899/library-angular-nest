import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";

import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserRoleEnum } from "@user/domain/user.entity";
const mockAuthGuard = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: mockAuthGuard });

describe("[e2e] POST /v1/bookInfos", () => {
  const v1Route = "/v1/bookInfos";

  it("Should respond 201 for a valid bookInfo", async () => {
    const bookInfo = new BookInfoBuilder(0).withName("Test").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid name", async () => {
    const bookInfo = new BookInfoBuilder(1).withName("").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(FPF.unsafeCoerce(1))
      .buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    expect(response.status).toBe(422);
  });

  it("Should respond 403 for client role", async () => {
    mockAuthGuard.withRole(UserRoleEnum.Client);
    const bookInfo = new BookInfoBuilder(3).withName("Test").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    mockAuthGuard.reset();
    expect(response.status).toBe(403);
  });
});
