import { Test } from "@nestjs/testing";
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
import { unsafeCoerce } from "fp-ts/lib/function";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { mockAuthGuard } from "@test/data-builders/mockAuthGuard";

let app: NestFastifyApplication;
let prismaService: PrismaService;
let userRepository: UserRepository;
const userBuilder = new UserBuilder();
const originalUser = userBuilder.withName("Test").build();

beforeAll(async () => {
  const testingModule = await Test.createTestingModule({
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

  userBuilder.reset();
  await executeTask(userRepository.save(originalUser));
});

afterEach(async () => {
  await prismaService.user.deleteMany();
});

describe("[e2e] PUT /v1/users/{userId}", () => {
  const v1Route = (id: string) => "/v1/users/" + id;
  it("Should respond 200 updated for a valid user", async () => {
    const userDTO = userBuilder.buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(200);
  });

  it("Should respond 422 for invalid name", async () => {
    const userDTO = userBuilder.withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const userDTO = userBuilder.withName(unsafeCoerce(1)).buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(422);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    // With User Saved with cpf to repeat
    const user = new UserBuilder(2)
      .withCPF("12345678902")
      .withEmail("usertwo@example.com")
      .withRole(UserRoleEnum.Client)
      .build();
    await executeTask(userRepository.save(user));

    const repeatCPF = user.cpf;

    const userDTO = userBuilder
      .withRole(UserRoleEnum.Client)
      .withCPF(repeatCPF)
      .buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(409);
  });
});
