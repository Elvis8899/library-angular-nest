import { HttpStatus } from "@nestjs/common";
import { FPF } from "@shared/utils/application/monads";
import { createBook } from "@test/modules/book/createBook";
import { useE2eApp } from "@test/util/e2eApp";

import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";

const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(async () => {
  await createBook(e2e.prisma, new BookInfoBuilder().withBookItems([]));
});

describe("[e2e] POST /v1/bookInfos/item", () => {
  const v1Route = "/v1/bookInfos/item";

  it("Should respond 201 for a valid bookItem", async () => {
    const bookItem = new BookInfoBuilder(0).buildItem();
    const response = await e2e.http().post(v1Route).send(bookItem);

    expect(response.status).toBe(HttpStatus.CREATED);
  });

  it("Should respond 422 for invalid book item", async () => {
    const response = await e2e.http().post(v1Route).send(FPF.unsafeCoerce({}));
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
