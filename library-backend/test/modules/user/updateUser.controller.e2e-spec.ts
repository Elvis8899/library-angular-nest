import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@src/app.module";
import * as request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/executeTask";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { UserRepository } from "@user/database/user.repository.port";
import { UserRoleEnum } from "@user/domain/user.entity";
import { unsafeCoerce } from "fp-ts/lib/function";
import { PinoLogger } from "nestjs-pino";

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
