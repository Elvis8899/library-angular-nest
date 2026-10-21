import { defaultRolePage } from "@app/layouts/components/sidebar/navMenuItems";
import { ROLE } from "@app/models/credentials.entity";

describe("defaultRolePage", () => {
  it("should be the first page the role can open", () => {
    expect(defaultRolePage(ROLE.ADMIN)).toBe("/users");
  });

  it("should be the home page when the role can open none", () => {
    expect(defaultRolePage(ROLE.GUEST)).toBe("/home");
  });
});
