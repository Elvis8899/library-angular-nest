import { PageRequestUtility } from "@app/shared/utils/pageRequest.utility";

describe("PageRequestUtility", () => {
  it("Should send nothing without a request", () => {
    expect(PageRequestUtility.toHttpParams().toString()).toBe("");
  });

  it("Should leave out page 0 and empty values", () => {
    const params = PageRequestUtility.toHttpParams({ page: 0, limit: 0 });

    expect(params.keys()).toEqual([]);
  });

  it("Should send the page, limit and sort", () => {
    const params = PageRequestUtility.toHttpParams<
      { createdAt: string },
      object
    >({
      page: 2,
      limit: 10,
      sort: { property: "createdAt", order: "desc" },
      query: { name: "Dom" },
    });

    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("10");
    expect(params.get("sort")).toBe('{"property":"createdAt","order":"desc"}');
    expect(params.has("query")).toBe(false);
  });
});
