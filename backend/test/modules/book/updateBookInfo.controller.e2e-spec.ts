import { HttpStatus } from "@nestjs/common";
import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";

import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
let bookInfoRepository: BookInfoRepository;
const bookInfoBuilder = new BookInfoBuilder();
const originalBookInfo = bookInfoBuilder.withName("Test").build();

const e2e = useE2eApp({
  authGuard: new MockAuthGuardBuilder(),
  resetEachTest: true,
});

beforeAll(() => {
  bookInfoRepository = e2e.get(BookInfoRepository);
});

beforeEach(async () => {
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
    expect(response.status).toBe(HttpStatus.OK);
  });

  it.each([
    { invalid: "an empty name", name: "" },
    {
      invalid: "a name that isn't a string",
      name: FPF.unsafeCoerce<number, string>(1),
    },
  ])("Should respond 422 for $invalid", async ({ name }) => {
    const bookInfoDTO = bookInfoBuilder.withName(name).buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
