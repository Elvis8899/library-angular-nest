import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";
import { z } from "zod";

const authGuard = new MockAuthGuardBuilder();
const e2e = useE2eApp({ authGuard });

const AuditBody = z.object({
  count: z.number(),
  data: z.array(
    z.object({
      userId: z.string().nullable(),
      userName: z.string().nullable(),
      useCase: z.string(),
      recordId: z.string().nullable(),
      input: z.unknown(),
    }),
  ),
});

// The mock guard's user
const admin = new UserBuilder(1)
  .withName("Admin")
  .withEmail("admin@example.com")
  .withCPF("")
  .withRole(UserRoleEnum.Admin)
  .build();

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
  authGuard.reset();
  await executeTask(e2e.get(UserRepository).save(admin));
});

describe("[e2e] GET /v1/audit", () => {
  it("Should show who made each write, and not the reads", async () => {
    const bia = new UserBuilder(2).withName("Bia");
    await executeTask(e2e.get(UserRepository).save(bia.build()));
    const updated = await e2e
      .http()
      .put(`/v1/users/${bia.build().id}`)
      .send(bia.withName("Beatriz").buildCreateDTO());
    await e2e.http().get("/v1/users");

    const response = await e2e.http().get("/v1/audit?useCase=user");

    expect(updated.status).toBe(HttpStatus.OK);
    expect(response.status).toBe(HttpStatus.OK);
    expect(AuditBody.parse(response.body)).toMatchObject({
      count: 1,
      data: [
        {
          userId: admin.id,
          userName: "Admin",
          useCase: "UpdateUser",
          recordId: bia.build().id,
          input: { id: bia.build().id, name: "Beatriz" },
        },
      ],
    });
    // The password is left out of the input
    expect(JSON.stringify(response.body)).not.toContain("password");
    expect(await e2e.prisma.auditEntry.count()).toBe(1);
  });

  it("Should not audit a refused write, logged in or not", async () => {
    await e2e.http().post("/v1/users").send({ name: "" });
    await e2e.http().post("/v1/refresh").send({ refreshToken: "x" });

    expect(await e2e.prisma.auditEntry.count()).toBe(0);
  });

  it("Should respond 422 for a period ending before it starts", async () => {
    const response = await e2e
      .http()
      .get("/v1/audit")
      .query({ from: "2026-10-22T00:00:00Z", before: "2026-10-21T00:00:00Z" });

    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 403 to a client", async () => {
    authGuard.withRole(UserRoleEnum.Client);

    const response = await e2e.http().get("/v1/audit");

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });
});
