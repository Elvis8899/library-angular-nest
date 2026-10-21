import { authConfig } from "@modules/auth/auth.config";
import { HttpStatus } from "@nestjs/common";
import { appInfo } from "@src/app.info";
import { buildE2eApp, closeE2eApp, E2eApp, useE2eApp } from "@test/util/e2eApp";
import { SwaggerDocumentBody } from "@test/util/responseBodies";

// Checks the setup that main.ts gets from app.setup.ts: helmet, Swagger
// and how client IPs are read behind a proxy

describe("[e2e] App setup", () => {
  const e2e = useE2eApp();

  it("Should send helmet's security headers, without a CSP", async () => {
    const response = await e2e.http().get("/check/status");

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toBeDefined();
    // Disabled on purpose in app.setup.ts
    expect(response.headers["content-security-policy"]).toBeUndefined();
  });

  it("Should serve the Swagger UI and the OpenAPI document", async () => {
    const [ui, document] = await Promise.all([
      e2e.http().get("/swagger"),
      e2e.http().get("/swagger-json"),
    ]);

    expect(ui.status).toBe(HttpStatus.OK);
    expect(ui.headers["content-type"]).toContain("text/html");
    expect(document.status).toBe(HttpStatus.OK);
    const body = SwaggerDocumentBody.parse(document.body);
    expect(body.info.title).toBe(appInfo.title);
    expect(body.paths).toHaveProperty("/v1/users");
    expect(body.components.securitySchemes).toHaveProperty("bearer");
  });
});

describe("[e2e] Client IP for login rate limiting", () => {
  // Failed logins for one email, each claiming another client IP
  const attemptLogins = async (e2e: E2eApp, email: string, count: number) => {
    const statuses: number[] = [];
    for (let i = 1; i <= count; i++) {
      const response = await e2e
        .http()
        .post("/v1/login")
        .set("X-Forwarded-For", `203.0.113.${String(i)}`)
        .send({ email, password: "wrong-password" });
      statuses.push(response.status);
    }
    return statuses;
  };

  it("Should ignore X-Forwarded-For when no proxy is trusted", async () => {
    const e2e = await buildE2eApp({ trustProxy: false });
    try {
      const statuses = await attemptLogins(
        e2e,
        "untrusted-proxy@example.com",
        authConfig.loginRateLimit + 1,
      );

      // Changing the header doesn't get around the limit
      expect(statuses.at(-1)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    } finally {
      await closeE2eApp(e2e);
    }
  });

  it("Should limit each forwarded client IP separately behind a trusted proxy", async () => {
    const e2e = await buildE2eApp({ trustProxy: ["loopback"] });
    try {
      const statuses = await attemptLogins(
        e2e,
        "trusted-proxy@example.com",
        authConfig.loginRateLimit + 1,
      );

      // Every request comes from another client, so none is limited
      expect(statuses).not.toContain(HttpStatus.TOO_MANY_REQUESTS);
      expect(new Set(statuses)).toEqual(new Set([HttpStatus.UNAUTHORIZED]));
    } finally {
      await closeE2eApp(e2e);
    }
  });
});
