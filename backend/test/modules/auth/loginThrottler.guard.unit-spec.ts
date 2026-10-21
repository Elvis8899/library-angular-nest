import { LoginThrottlerGuard } from "@modules/auth/guards/loginThrottler.guard";
import { Reflector } from "@nestjs/core";
import { ThrottlerStorageService } from "@nestjs/throttler";

// Exposes the protected tracker so its key can be checked directly
class TestableLoginThrottlerGuard extends LoginThrottlerGuard {
  tracker(req: { ip?: string; body?: { email?: unknown } }) {
    return this.getTracker(req);
  }
}

describe("[Unit] LoginThrottlerGuard", () => {
  const guard = new TestableLoginThrottlerGuard(
    { throttlers: [] },
    new ThrottlerStorageService(),
    new Reflector(),
  );

  it.each([
    [
      "IP and lowercased email",
      { ip: "10.0.0.1", body: { email: "User@Example.com" } },
      "10.0.0.1:user@example.com",
    ],
    ["missing email", { ip: "10.0.0.1", body: {} }, "10.0.0.1:"],
    ["non-string email", { ip: "10.0.0.1", body: { email: 42 } }, "10.0.0.1:"],
    ["missing body and IP", {}, ":"],
  ])("Should track by %s", async (_: string, req, expected: string) => {
    await expect(guard.tracker(req)).resolves.toBe(expected);
  });
});
