import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "@src/app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { FakeLoggerService } from "@src/shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { PinoLogger } from "nestjs-pino";
import { executeTask } from "@src/shared/utils/executeTask";
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { ExecutionContext } from "@nestjs/common";
import { RequestJWTPayload } from "@src/modules/auth/domain/login.entity";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";

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
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const user: RequestJWTPayload = {
          sub: "abc123",
          email: "admin@admin.com",
          role: UserRoleEnum.Admin,
          iat: 0,
          exp: 0,
          aud: "",
          iss: "",
        };
        request.user = user;
        return true;
      },
    })
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
  const v1Route = "/v1/users";

  it("Should respond 200 with user List", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));

    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.data.length).toBe(1);
  });

  it("Should respond 200 with empty list", async () => {
    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 100,
      page: 1,
    });
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(0);
  });
});
