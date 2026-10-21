import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
let bookInfoRepository: BookInfoRepository;
const bookInfoBuilder = new BookInfoBuilder();
const originalBookInfo = bookInfoBuilder.withName("Test").build();

const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(() => {
  bookInfoRepository = e2e.get(BookInfoRepository);
});

beforeEach(async () => {
  await resetDatabase(e2e.prisma);

  bookInfoBuilder.reset();
  await executeTask(bookInfoRepository.save(originalBookInfo));
});

describe("[e2e] PUT /v1/bookInfos/{bookInfoId}", () => {
  const v1Route = (id: string) => "/v1/bookInfos/" + id;
  it("Should respond 200 updated for a valid bookInfo", async () => {
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(200);
  });

  it("Should respond 422 for invalid name", async () => {
    const bookInfoDTO = bookInfoBuilder.withName("").buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfoDTO = bookInfoBuilder
      .withName(FPF.unsafeCoerce(1))
      .buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(422);
  });
});
