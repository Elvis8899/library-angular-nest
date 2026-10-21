import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";

let bookInfoRepository: BookInfoRepository;
const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(() => {
  bookInfoRepository = e2e.module.get<BookInfoRepository>(BookInfoRepository);
});

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
});

describe("[e2e] DELETE /v1/bookInfos/:id", () => {
  const v1Route = (bookInfoId: string) => "/v1/bookInfos/" + bookInfoId;

  it("Should respond 200 for deleted bookInfo", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const response = await e2e.http().delete(v1Route(bookInfo.id));

    expect(response.status).toBe(HttpStatus.OK);
    const bookInfoAmount = await e2e.prisma.bookInfo.count();
    expect(bookInfoAmount).toBe(0);
  });

  it("Should respond 422 for invalid id", async () => {
    const response = await e2e.http().delete(v1Route("fakeId"));
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 404 for bookInfo not found", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    const response = await e2e.http().delete(v1Route(bookInfo.id));
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
