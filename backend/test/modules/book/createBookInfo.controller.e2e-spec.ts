import { HttpStatus } from "@nestjs/common";
import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";

import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
const mockAuthGuard = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: mockAuthGuard });

describe("[e2e] POST /v1/bookInfos", () => {
  const v1Route = "/v1/bookInfos";

  it("Should respond 201 for a valid bookInfo", async () => {
    const bookInfo = new BookInfoBuilder(0).withName("Test").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    expect(response.status).toBe(HttpStatus.CREATED);
  });

  it.each([
    { invalid: "an empty name", name: "" },
    {
      invalid: "a name that isn't a string",
      name: FPF.unsafeCoerce<number, string>(1),
    },
  ])("Should respond 422 for $invalid", async ({ name }) => {
    const bookInfo = new BookInfoBuilder(1).withName(name).buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 403 for client role", async () => {
    mockAuthGuard.withRole(UserRoleEnum.Client);
    const bookInfo = new BookInfoBuilder(3).withName("Test").buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    mockAuthGuard.reset();
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });
});
