import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { FPF } from "@shared/utils/application/monads";
import { AppModule } from "@src/app.module";
import { createTestApp } from "@test/util/createTestApp";
import request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { comparePassword } from "@auth/util/signTokenParams";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { UserRepository } from "@user/database/user.repository.port";
import { UserRoleEnum } from "@user/domain/user.entity";
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

  app = await createTestApp(testingModule);
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

  it("Should persist every updated field", async () => {
    // Given new values for all editable fields
    const userDTO = userBuilder
      .withName("Updated Name")
      .withEmail("updated@example.com")
      .withCPF("11144477735")
      .withPassword("new-password-123")
      .buildCreateDTO();

    // When the user is updated
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);

    // Then all of them are stored, with the new password hashed
    expect(response.status).toBe(200);
    const stored = await prismaService.user.findUnique({
      where: { id: originalUser.id },
    });
    expect(stored).toMatchObject({
      name: "Updated Name",
      email: "updated@example.com",
      cpf: "111.444.777-35",
    });
    expect(
      await comparePassword("new-password-123", stored?.password ?? ""),
    ).toBe(true);
  });

  it("Should respond 422 for invalid name", async () => {
    const userDTO = userBuilder.withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const userDTO = userBuilder.withName(FPF.unsafeCoerce(1)).buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalUser.id))
      .send(userDTO);
    expect(response.status).toBe(422);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    // With User Saved with cpf to repeat
    const user = new UserBuilder(2)
      .withCPF("11144477735")
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
