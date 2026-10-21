import { useE2eApp } from "@test/util/e2eApp";

import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";

let bookInfoRepository: BookInfoRepository;
const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(async () => {
  bookInfoRepository = e2e.get(BookInfoRepository);

  const { bookItems: _, ...bookInfo } = new BookInfoBuilder()
    .withBookItems([])
    .build();
  await e2e.prisma.bookInfo.create({
    data: { ...bookInfo },
  });
});

beforeEach(async () => {
  await e2e.prisma.bookItem.deleteMany();
});

describe("[e2e] DELETE /v1/bookInfos/item/:id", () => {
  const v1Route = (bookItemId: string) => "/v1/bookInfos/item/" + bookItemId;

  it("Should respond 200 for deleted bookItem", async () => {
    const bookItem = new BookInfoBuilder().buildItem();

    await executeTask(bookInfoRepository.createBookItem(bookItem));

    const response = await e2e.http().delete(v1Route(bookItem.id));

    expect(response.status).toBe(HttpStatus.OK);
    const bookItemAmount = await e2e.prisma.bookItem.count();
    expect(bookItemAmount).toBe(0);
  });

  it("Should respond 422 for invalid id", async () => {
    const response = await e2e.http().delete(v1Route("fakeId"));
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 404 for bookItem not found", async () => {
    const bookItem = new BookInfoBuilder().withName("Test").build();
    const response = await e2e.http().delete(v1Route(bookItem.id));
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
