import { authConfig } from "@modules/auth/auth.config";
import { HttpStatus } from "@nestjs/common";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { useE2eApp } from "@test/util/e2eApp";

const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder().build() });

describe("[e2e] POST /v1/login rate limit", () => {
  const login = (email: string) =>
    e2e.http().post("/v1/login").send({ email, password: "wrong-password" });

  it("Should respond 429 after too many attempts for the same email", async () => {
    // Given the allowed number of failed attempts for one email
    for (let i = 0; i < authConfig.loginRateLimit; i++) {
      const response = await login("target@example.com");
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    }

    // Then the next attempt is throttled, regardless of email case
    const throttled = await login("TARGET@example.com");
    expect(throttled.status).toBe(HttpStatus.TOO_MANY_REQUESTS);

    // And other accounts are not affected
    const otherEmail = await login("someone-else@example.com");
    expect(otherEmail.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
