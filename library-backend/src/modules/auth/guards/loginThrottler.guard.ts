import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Limits login attempts per client IP and email. Including the email keeps
 * the limit per account when every request arrives from the same proxy IP
 * (see TRUST_PROXY), instead of sharing one limit between all users.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: {
    ip?: string;
    body?: { email?: unknown };
  }): Promise<string> {
    const email =
      typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    return Promise.resolve(`${req.ip ?? ""}:${email}`);
  }
}
