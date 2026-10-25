import { RealBookInfoRepository } from "@modules/book/database/realBookInfo.repository";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { bookInfoRepositoryContract } from "@test/modules/book/bookInfoRepository.contract";
import { resetDatabase } from "@test/util/resetDatabase";

let prismaService: PrismaService;
let bookInfoRepository: RealBookInfoRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealBookInfoRepository, PrismaService],
  }).compile();

  bookInfoRepository = module.get(RealBookInfoRepository);
  prismaService = module.get(PrismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

// What only the database holds: prices as whole centavos
describe("[Integration] BookInfo repository", () => {
  beforeEach(async () => {
    await resetDatabase(prismaService);
  });

  it("Should store a price with centavos as cents", async () => {
    const bookInfo = new BookInfoBuilder().withPrice(12.5).build();

    await executeTask(bookInfoRepository.save(bookInfo));

    const row = await prismaService.bookInfo.findUnique({
      where: { id: bookInfo.id },
    });
    expect(row?.priceCents).toBe(1250);
  });
});

bookInfoRepositoryContract("real");
