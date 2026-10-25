import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { ApplicationRef } from "@angular/core";
import {
  AuditEntryEntity,
  noAuditFilters,
} from "@app/pages/audit/audit.entity";
import { AuditService } from "@app/pages/audit/audit.http.service";
import { AuditLogComponent } from "@app/pages/audit/auditLog/auditLog.component";
import { UserService } from "@app/services/user.http.service";
import { provideTranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";
import { BehaviorSubject, of, throwError } from "rxjs";

const entry = (
  overrides: Partial<AuditEntryEntity> = {}
): AuditEntryEntity => ({
  id: "e1",
  userId: "u1",
  userName: "Ana",
  useCase: "UpdateUser",
  recordId: "u2",
  input: { id: "u2" },
  recordedAt: "2026-10-21T12:00:00Z",
  ...overrides,
});

describe("AuditLogComponent", () => {
  let spectator: Spectator<AuditLogComponent>;
  let breakpoints: BehaviorSubject<BreakpointState>;
  const audit = { getEntries: vi.fn() };
  const users = { getPaginatedUsers: vi.fn() };

  const createComponent = createComponentFactory({
    component: AuditLogComponent,
    providers: [
      provideTranslateService(),
      { provide: AuditService, useValue: audit },
      { provide: UserService, useValue: users },
      {
        provide: BreakpointObserver,
        useFactory: () => ({ observe: () => breakpoints }),
      },
    ],
  });

  const text = (element: Element | null | undefined) =>
    element?.textContent?.replace(/\s+/g, " ").trim();
  const rows = () => spectator.queryAll("tr.mat-mdc-row");
  const lastQuery = () => audit.getEntries.mock.lastCall?.[0].query;

  beforeEach(() => {
    breakpoints = new BehaviorSubject<BreakpointState>({
      matches: false,
      breakpoints: {},
    });
    audit.getEntries.mockReset().mockReturnValue(
      of({
        data: [
          entry(),
          entry({
            id: "e2",
            userId: null,
            userName: null,
            useCase: "LoginCommand",
            recordId: null,
            input: null,
          }),
        ],
        count: 2,
        page: 0,
        limit: 25,
      })
    );
    users.getPaginatedUsers.mockReset().mockReturnValue(
      of({
        data: [{ id: "u1", name: "Ana" }],
        count: 1,
        page: 0,
        limit: 1000,
      })
    );
    spectator = createComponent();
  });

  it("Should list the entries, newest first, with who and what", () => {
    expect(audit.getEntries).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, limit: 25, query: noAuditFilters })
    );
    expect(users.getPaginatedUsers).toHaveBeenCalledWith({
      page: 0,
      limit: 1000,
    });
    expect(rows()).toHaveLength(2);
    const [first, second] = rows();
    expect(text(first)).toContain("Ana");
    expect(text(first)).toContain("UpdateUser");
    expect(text(first)).toContain("u2");
    expect(first.querySelector("pre")).toHaveText('"id": "u2"');
    expect(text(second)).toContain("audit.noAccount");
    expect(second.querySelector("details")).toBeNull();
    expect(spectator.component.users()).toEqual([{ id: "u1", name: "Ana" }]);
  });

  it("Should filter by what was filled in, and clear the filters", () => {
    spectator.component.filters.patchValue({ userId: "u1", useCase: "User" });
    spectator.click("button[name='search']");

    expect(lastQuery()).toEqual({
      ...noAuditFilters,
      userId: "u1",
      useCase: "User",
    });

    spectator.click("button[name='clear']");
    expect(lastQuery()).toEqual(noAuditFilters);
    expect(spectator.component.filters.getRawValue()).toEqual(noAuditFilters);
  });

  it("Should not search a period ending before it starts", () => {
    spectator.component.filters.patchValue({
      from: "2026-10-22",
      to: "2026-10-21",
    });
    spectator.detectChanges();
    spectator.click("button[name='search']");

    expect(spectator.query("p.error")).toHaveText("audit.periodInverted");
    expect(audit.getEntries).toHaveBeenCalledTimes(1);
  });

  it("Should offer every account to filter by", () => {
    spectator.click("mat-select[name='userId']");
    spectator.inject(ApplicationRef).tick();
    expect(
      spectator
        .queryAll("mat-option", { root: true })
        .map((option) => text(option))
    ).toEqual(["audit.anyone", "Ana"]);
  });

  it("Should show fewer columns on a small screen, and no accounts when they fail", () => {
    breakpoints.next({ matches: true, breakpoints: {} });
    users.getPaginatedUsers.mockReturnValue(throwError(() => new Error("x")));
    spectator = createComponent();

    expect(spectator.component.columns()).toEqual([
      "recordedAt",
      "user",
      "useCase",
      "input",
    ]);
    expect(spectator.component.users()).toEqual([]);
  });
});
