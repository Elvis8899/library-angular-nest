import { Test } from "@nestjs/testing";
import { auditEntryOf } from "@shared/audit/auditEntry";
import { RealAuditLog } from "@shared/audit/realAuditLog";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { resetDatabase } from "@test/util/resetDatabase";

let prisma: PrismaService;
let audit: RealAuditLog;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [RealAuditLog, PrismaService, RealUUIDGeneratorService],
  }).compile();
  audit = module.get(RealAuditLog);
  prisma = module.get(PrismaService);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("[Integration] Audit log", () => {
  const window = { page: 0, limit: 20, offset: 0 };
  const useCases = async (filter: Parameters<RealAuditLog["findPage"]>[0]) =>
    (await executeTask(audit.findPage(filter, window))).data.map(
      ({ useCase }) => useCase,
    );

  beforeEach(async () => {
    await resetDatabase(prisma);
    await executeTask(
      audit.record(
        auditEntryOf(
          "CreateUser",
          { props: { name: "Ana" } },
          { id: "u2" },
          "u1",
        ),
      ),
    );
    await executeTask(
      audit.record(auditEntryOf("RefreshTokenCommand", undefined, null, null)),
    );
    await prisma.auditEntry.updateMany({
      where: { useCase: "CreateUser" },
      data: { recordedAt: new Date("2026-10-21T10:00:00Z") },
    });
    await prisma.auditEntry.updateMany({
      where: { useCase: "RefreshTokenCommand" },
      data: { recordedAt: new Date("2026-10-22T10:00:00Z") },
    });
  });

  it("Should store an entry, its input as JSON or none", async () => {
    const { data, count } = await executeTask(audit.findPage({}, window));

    expect(count).toBe(2);
    expect(data[1]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data).toMatchObject([
      { useCase: "RefreshTokenCommand", input: null, userId: null },
      {
        userId: "u1",
        useCase: "CreateUser",
        recordId: "u2",
        input: { props: { name: "Ana" } },
        recordedAt: new Date("2026-10-21T10:00:00Z"),
      },
    ]);
  });

  it("Should filter by every field and the period", async () => {
    const [byUser, byUseCase, byRecord, fromDay, beforeDay, betweenDays] =
      await Promise.all([
        useCases({ userId: "u1" }),
        useCases({ useCase: "TOKEN" }),
        useCases({ recordId: "u2" }),
        useCases({ from: new Date("2026-10-22T00:00:00Z") }),
        useCases({ before: new Date("2026-10-22T00:00:00Z") }),
        useCases({
          from: new Date("2026-10-21T00:00:00Z"),
          before: new Date("2026-10-23T00:00:00Z"),
        }),
      ]);
    expect(byUser).toEqual(["CreateUser"]);
    expect(byUseCase).toEqual(["RefreshTokenCommand"]);
    expect(byRecord).toEqual(["CreateUser"]);
    expect(fromDay).toEqual(["RefreshTokenCommand"]);
    expect(beforeDay).toEqual(["CreateUser"]);
    expect(betweenDays).toHaveLength(2);
  });
});
