import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "@src/app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { FakeLoggerService } from "@src/shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { PinoLogger } from "nestjs-pino";
import { executeTask } from "@src/shared/utils/executeTask";
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { mockAuthGuard } from "@test/data-builders/mockAuthGuard";

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
    .useValue(mockAuthGuard())
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

describe("[e2e] DELETE /v1/users/:id", () => {
  const v1Route = (userId: string) => "/v1/users/" + userId;

  it("Should respond 200 for deleted user", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));

    const response = await request(app.getHttpServer()).delete(
      v1Route(user.id),
    );

    expect(response.status).toBe(200);
    const userAmount = await prismaService.user.count();
    expect(userAmount).toBe(0);
  });

  it("Should respond 422 for invalid id", async () => {
    const response = await request(app.getHttpServer()).delete(
      v1Route("fakeId"),
    );
    expect(response.status).toBe(422);
  });

  it("Should respond 404 for user not found", async () => {
    const user = new UserBuilder().withName("Test").build();
    const response = await request(app.getHttpServer()).delete(
      v1Route(user.id),
    );
    expect(response.status).toBe(404);
  });
});
