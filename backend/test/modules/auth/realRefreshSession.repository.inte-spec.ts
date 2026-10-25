import { RealRefreshSessionRepository } from "@modules/auth/database/realRefreshSession.repository";
import { RefreshSession } from "@modules/auth/domain/refreshSession.entity";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { refreshSessionRepositoryContract } from "@test/modules/auth/refreshSessionRepository.contract";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { resetDatabase } from "@test/util/resetDatabase";

let prismaService: PrismaService;
let refreshSessionRepository: RealRefreshSessionRepository;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealRefreshSessionRepository, PrismaService],
  }).compile();

  refreshSessionRepository = module.get(RealRefreshSessionRepository);
  prismaService = module.get(PrismaService);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

// What only the database refuses: a user that doesn't exist
describe("[Integration] Refresh session repository", () => {
  const user = new UserBuilder().build();
  const tomorrow = () => new Date(Date.now() + 86400 * 1000);
  const session = (n: number, expiresAt = tomorrow()): RefreshSession => ({
    id: createTestId(TableNameEnum.RefreshSession, n),
    userId: user.id,
    currentJti: createTestId(TableNameEnum.None, n),
    expiresAt,
  });
  beforeEach(async () => {
    await resetDatabase(prismaService);
    await prismaService.user.create({ data: user });
  });

  it("Should fail to create a session for an unknown user", async () => {
    await expect(
      executeTask(
        refreshSessionRepository.create({
          ...session(1),
          userId: createTestId(TableNameEnum.User, 99),
        }),
      ),
    ).rejects.toBeInstanceOf(Error);
  });
});

refreshSessionRepositoryContract("real");
