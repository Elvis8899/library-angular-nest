import { AuthGuard } from "@auth/guards/auth.guard";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { AppModule } from "@src/app.module";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { UserRepository } from "@user/database/user.repository.port";
import { PinoLogger } from "nestjs-pino";
import * as request from "supertest";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;

let userRepository: UserRepository;
beforeAll(async () => {
  testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideGuard(AuthGuard)
    .useValue(new MockAuthGuardBuilder())
    .compile();

  app = testingModule.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  prismaService = testingModule.get<PrismaService>(PrismaService);

  userRepository = testingModule.get<UserRepository>(UserRepository);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

beforeEach(async () => {
  await prismaService.user.deleteMany();
});

afterEach(async () => {
  await prismaService.user.deleteMany();
});

describe("[e2e] GET /v1/users", () => {
  const v1Route = (id: string) => "/v1/users/" + id;

  it("Should respond 200 with user List", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));

    const response = await request(app.getHttpServer())
      .get(v1Route(user.id))
      .query({
        limit: 10,
        page: 0,
      });
    expect(response.status).toBe(200);
    expect(response.body?.id).toBe(user.id);
  });

  it("Should respond 404 when user not found", async () => {
    const response = await request(app.getHttpServer())
      .get(v1Route("00000000-0000-0000-0001-000000000000"))
      .query({
        limit: 100,
        page: 1,
      });
    expect(response.status).toBe(404);
  });
});
