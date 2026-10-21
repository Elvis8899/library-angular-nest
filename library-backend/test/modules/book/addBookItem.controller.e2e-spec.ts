import { FPF } from "@shared/utils/application/monads";
import { createBook } from "@test/util/createBook";
import { useE2eApp } from "@test/util/e2eApp";

import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";

const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(async () => {
  await createBook(e2e.prisma, new BookInfoBuilder().withBookItems([]));
});

describe("[e2e] POST /v1/bookInfos/item", () => {
  const v1Route = "/v1/bookInfos/item";

  it("Should respond 201 for a valid bookItem", async () => {
    const bookItem = new BookInfoBuilder(0).buildItem();
    const response = await e2e.http().post(v1Route).send(bookItem);

    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid book item", async () => {
    const response = await e2e.http().post(v1Route).send(FPF.unsafeCoerce({}));
    expect(response.status).toBe(422);
  });
});
