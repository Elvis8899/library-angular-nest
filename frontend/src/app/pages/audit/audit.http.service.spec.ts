import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { noAuditFilters } from "@app/pages/audit/audit.entity";
import { AuditService } from "@app/pages/audit/audit.http.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";

describe("AuditService", () => {
  let spectator: SpectatorService<AuditService>;
  let http: HttpTestingController;
  const createService = createServiceFactory({
    service: AuditService,
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  beforeEach(() => {
    spectator = createService();
    http = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("Should get a page of the entries with the filters filled in", () => {
    spectator.service
      .getEntries({
        page: 2,
        limit: 25,
        sort: { property: "recordedAt", order: "desc" },
        query: { ...noAuditFilters, useCase: "User", recordId: "u1" },
      })
      .subscribe();
    spectator.service.getEntries({ page: 0, limit: 0 }).subscribe();

    http
      .expectOne({
        method: "GET",
        url: "/v1/audit?page=2&limit=25&useCase=User&recordId=u1",
      })
      .flush({ data: [], count: 0, page: 2, limit: 25 });
    http.expectOne({ method: "GET", url: "/v1/audit" }).flush({});
  });
});
