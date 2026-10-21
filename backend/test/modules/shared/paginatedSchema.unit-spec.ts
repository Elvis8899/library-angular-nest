import { paginatedSchema } from "@shared/utils/domain/query.base";
import { z } from "zod";

describe("[Unit] paginatedSchema", () => {
  const Page = paginatedSchema(z.object({ id: z.string() }));

  it("Should accept a page whose rows match", () => {
    const page = { data: [{ id: "1" }], count: 1, page: 0, limit: 10 };

    expect(Page.parse(page)).toEqual(page);
  });

  it("Should reject a row that doesn't match", () => {
    const page = { data: [{ id: 1 }], count: 1, page: 0, limit: 10 };

    expect(Page.safeParse(page).success).toBe(false);
  });
});
