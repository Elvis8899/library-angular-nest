import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { useE2eApp } from "@test/util/e2eApp";

let bookInfoRepository: BookInfoRepository;
const e2e = useE2eApp({
  authGuard: new MockAuthGuardBuilder(),
  resetEachTest: true,
});

beforeAll(() => {
  bookInfoRepository = e2e.get(BookInfoRepository);
});

describe("[e2e] GET /v1/bookInfos", () => {
  const v1Route = (id: string) => "/v1/bookInfos/" + id;

  it("Should respond 200 with bookInfo", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const response = await e2e.http().get(v1Route(bookInfo.id)).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.id).toBe(bookInfo.id);
  });

  it("Should respond 404 when bookInfo not found", async () => {
    const response = await e2e
      .http()
      .get(v1Route("00000000-0000-0000-0000-000000000000"))
      .query({
        limit: 100,
        page: 1,
      });
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
