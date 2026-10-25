import { auditEntryView } from "@modules/audit/domain/auditQuery";
import {
  AuditEntriesQuery,
  AuditEntriesQueryHandler,
} from "@modules/audit/queries/auditEntries/auditEntries.query";
import { FakeUserRepository } from "@modules/user/database/fakeUser.repository";
import { UnprocessableEntityException } from "@nestjs/common";
import { auditEntryOf } from "@shared/audit/auditEntry";
import { FakeAuditLog } from "@shared/audit/fakeAuditLog";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

const ana = new UserBuilder(1).withName("Ana").build();

describe("[Unit] Audit entries", () => {
  const ctx = useHandlerModule(
    { providers: [AuditEntriesQueryHandler] },
    (get) => ({
      handler: get(AuditEntriesQueryHandler),
      audit: get(FakeAuditLog),
      users: get(FakeUserRepository),
    }),
  );

  // Recorded at the given instant
  const recorded = async (
    at: string,
    ...args: Parameters<typeof auditEntryOf>
  ) => {
    ctx.audit.now = new Date(at);
    await executeTask(ctx.audit.record(auditEntryOf(...args)));
  };
  const list = (filters: Record<string, unknown> = {}, page = {}) =>
    ctx.handler.execute(new AuditEntriesQuery(page, filters));

  beforeEach(async () => {
    await executeTask(ctx.users.save(ana));
    await recorded(
      "2026-10-21T10:00:00Z",
      "CreateUser",
      { props: { name: "Bia" } },
      { id: "u2" },
      ana.id,
    );
    await recorded(
      "2026-10-21T23:30:00Z",
      "UpdateUser",
      { id: "u2" },
      undefined,
      ana.id,
    );
    await recorded(
      "2026-10-22T09:00:00Z",
      "LoginCommand",
      { email: "a@b.c" },
      undefined,
      null,
    );
  });

  it("Should list the entries newest first, with the users' names", async () => {
    const { page, names } = await list();

    expect(page.count).toBe(3);
    expect(page.data.map(({ useCase }) => useCase)).toEqual([
      "LoginCommand",
      "UpdateUser",
      "CreateUser",
    ]);
    expect(names).toEqual(new Map([[ana.id, "Ana"]]));
  });

  it("Should filter by person, part of the name, record and period", async () => {
    const useCases = async (filters: Record<string, unknown>) =>
      (await list(filters)).page.data.map(({ useCase }) => useCase);

    expect(await useCases({ userId: ana.id })).toEqual([
      "UpdateUser",
      "CreateUser",
    ]);
    expect(await useCases({ useCase: "user" })).toEqual([
      "UpdateUser",
      "CreateUser",
    ]);
    expect(await useCases({ recordId: "u2" })).toEqual([
      "UpdateUser",
      "CreateUser",
    ]);
    expect(
      await useCases({
        from: "2026-10-21T12:00:00Z",
        before: "2026-10-22T09:00:00Z",
      }),
    ).toEqual(["UpdateUser"]);
    // Blanks are no filter
    expect(await useCases({ userId: "", useCase: "", from: "" })).toHaveLength(
      3,
    );
  });

  it("Should page the entries", async () => {
    const { page } = await list({}, { page: 1, limit: 2 });

    expect(page).toMatchObject({ count: 3, page: 1, limit: 2 });
    expect(page.data.map(({ useCase }) => useCase)).toEqual(["CreateUser"]);
  });

  it("Should refuse an invalid filter or a period ending before it starts", async () => {
    await expect(list({ userId: "x" })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    await expect(
      list({ from: "2026-10-22T00:00:00Z", before: "2026-10-21T00:00:00Z" }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe("[Unit] Audit entry response", () => {
  it("Should name the user, none without one or for an unknown one", () => {
    const entry = {
      ...auditEntryOf("X", undefined, null, null),
      id: "e1",
      recordedAt: new Date("2026-10-21T12:00:00Z"),
    };
    const names = new Map([["u1", "Ana"]]);

    expect(auditEntryView(names)({ ...entry, userId: "u1" }).userName).toBe(
      "Ana",
    );
    expect(
      auditEntryView(names)({ ...entry, userId: "u2" }).userName,
    ).toBeNull();
    expect(auditEntryView(names)(entry).userName).toBeNull();
  });
});
