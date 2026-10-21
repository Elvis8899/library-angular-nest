import { HttpParams } from "@angular/common/http";
import { PageRequest } from "@app/models/utils/pageRequest.entity";

export class PageRequestUtility {
  /**
   * Turns a page request into the query parameters of a paginated endpoint.
   * Page 0 and missing values are left out, so the API uses its defaults.
   * The query is left to each service, which knows what its endpoint filters by.
   */
  static toHttpParams<T, Q>(req?: PageRequest<T, Q>): HttpParams {
    let params = new HttpParams();
    if (req?.page) params = params.append("page", req.page);
    if (req?.limit) params = params.append("limit", req.limit);
    if (req?.sort) {
      params = params
        .append("sortBy", String(req.sort.property))
        .append("order", req.sort.order);
    }
    return params;
  }
}
