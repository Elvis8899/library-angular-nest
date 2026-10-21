import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";
import { PageBody } from "@test/util/responseBodies";

let bookInfoRepository: BookInfoRepository;
const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(() => {
  bookInfoRepository = e2e.module.get<BookInfoRepository>(BookInfoRepository);
});

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
});

describe("[e2e] GET /v1/bookInfos", () => {
  const v1Route = "/v1/bookInfos";

  it("Should respond 200 with bookInfo List", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const response = await e2e.http().get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(1);
    expect(response.body?.data?.length).toBe(1);
  });

  it("Should respond 200 with the books whose name contains the search", async () => {
    const domCasmurro = new BookInfoBuilder(1).withName("Dom Casmurro").build();
    const cortico = new BookInfoBuilder(2).withName("O Cortiço").build();
    await executeTask(bookInfoRepository.save(domCasmurro));
    await executeTask(bookInfoRepository.save(cortico));

    const response = await e2e
      .http()
      .get(v1Route)
      .query({ limit: 10, page: 0, name: "casm" });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(1);
    expect(response.body?.data?.[0]?.id).toBe(domCasmurro.id);
  });

  it("Should respond 200 with the books created in the range, sorted", async () => {
    const book = (index: number, name: string, createdAt: string) =>
      new BookInfoBuilder(index)
        .withName(name)
        .withCreatedAt(new Date(createdAt))
        .build();
    const iracema = book(1, "Iracema", "2026-10-13T12:00:00.000Z");
    const cortico = book(2, "O Cortiço", "2026-10-13T15:00:00.000Z");
    const nextDay = book(3, "Dom Casmurro", "2026-10-14T12:00:00.000Z");
    for (const b of [iracema, cortico, nextDay]) {
      await executeTask(bookInfoRepository.save(b));
    }

    const response = await e2e.http().get(v1Route).query({
      createdFrom: "2026-10-13T03:00:00.000Z",
      createdBefore: "2026-10-14T03:00:00.000Z",
      sortBy: "name",
      order: "desc",
    });
    expect(response.status).toBe(200);
    const body = PageBody.parse(response.body);
    expect(body.count).toBe(2);
    expect(body.data.map((b) => b.id)).toEqual([cortico.id, iracema.id]);
  });

  it("Should respond 422 to an unknown sort field", async () => {
    const response = await e2e.http().get(v1Route).query({ sortBy: "price" });
    expect(response.status).toBe(422);
  });

  it("Should respond 200 with empty list", async () => {
    const response = await e2e.http().get(v1Route).query({
      limit: 100,
      page: 1,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(0);
  });
});
