import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { PageRequest } from "@app/models/utils/pageRequest.entity";
import {
  AuditEntryEntity,
  auditParams,
  AuditQuery,
} from "@app/pages/audit/audit.entity";
import { PageRequestUtility } from "@app/shared/utils/pageRequest.utility";
import type { AuditEntryPage } from "@library/contracts";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuditService {
  private readonly _http = inject(HttpClient);

  /** A page of the entries, newest first, with the filters filled in. */
  getEntries(
    req: PageRequest<AuditEntryEntity, AuditQuery>
  ): Observable<AuditEntryPage> {
    const params = PageRequestUtility.toHttpParams({
      ...req,
      sort: undefined,
    }).appendAll(req.query ? auditParams(req.query) : {});
    return this._http.get<AuditEntryPage>("/v1/audit", { params });
  }
}
