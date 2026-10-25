import { requestContext } from "@fastify/request-context";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";

declare module "@fastify/request-context" {
  interface RequestContextData {
    // The account a request comes from, once its guards passed
    requesterId: string | null;
  }
}

/**
 * Keeps who sent the request where the use cases it runs read it
 * (`currentRequesterId`), so the audit knows who changed what without every
 * command carrying it. Runs after the guards, which set the user.
 */
@Injectable()
export class RequesterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { sub?: unknown } | null }>();
    requestContext.set(
      "requesterId",
      typeof user?.sub === "string" ? user.sub : null,
    );
    return next.handle();
  }
}

/** Who sent the request being handled; null outside one (a script, a
 * spec) or without a login. */
export const currentRequesterId = (): string | null =>
  requestContext.get("requesterId") ?? null;
