import {
  defaultRolePage,
  menuRows,
  sidebarMenuItems,
} from "@app/layouts/components/sidebar/navMenuItems";
import { ROLE } from "@app/models/credentials.entity";

describe("defaultRolePage", () => {
  it("should be the first page the role can open", () => {
    expect(defaultRolePage(ROLE.ADMIN)).toBe("/users");
  });

  it("should be the home page when the role can open none", () => {
    expect(defaultRolePage(ROLE.GUEST)).toBe("/home");
  });
});

describe("menuRows", () => {
  const page = (route: string) =>
    sidebarMenuItems.find((item) => item.route === route)!;

  it("should put a group where its first page is, with its other pages", () => {
    const rows = menuRows([page("/users"), page("/books"), page("/audit")]);

    expect(rows).toEqual([
      {
        kind: "group",
        group: page("/users").group,
        items: [page("/users"), page("/audit")],
      },
      { kind: "item", item: page("/books") },
    ]);
  });

  it("should show a group's only page by itself", () => {
    expect(menuRows([page("/audit"), page("/books")])).toEqual([
      { kind: "item", item: page("/audit") },
      { kind: "item", item: page("/books") },
    ]);
  });
});
