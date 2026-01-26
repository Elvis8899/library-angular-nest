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
import { UserBuilder } from "@test/data-builders/userBuilder";
import { unsafeCoerce } from "fp-ts/lib/function";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { ExecutionContext } from "@nestjs/common";
import { RequestJWTPayload } from "@src/modules/auth/domain/login.entity";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;
const userBuilder = new UserBuilder(1);

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

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

beforeEach(async () => {
  await prismaService.user.deleteMany();
  userBuilder.reset();
});

afterEach(async () => {
  await prismaService.user.deleteMany();
});

describe("[e2e] POST /v1/users", () => {
  const v1Route = "/v1/users";

  it("Should respond 201 for a valid user", async () => {
    const user = userBuilder.withName("Test").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid name", async () => {
    const user = userBuilder.withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid cpf", async () => {
    const user = userBuilder.withCPF("12312").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const user = userBuilder.withName(unsafeCoerce(1)).buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    const user = userBuilder.buildCreateDTO();
    const userCopy = user;
    const newuserResponse = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(newuserResponse.status).toBe(201);
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(userCopy);
    expect(response.status).toBe(409);
  });
});
