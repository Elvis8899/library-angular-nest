import { ExecutionContext } from "@nestjs/common";
import { RequestJWTPayload } from "@src/modules/auth/domain/login.entity";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";

export const defaultAuthGuardPayload: RequestJWTPayload = {
  sub: "abc123",
  email: "admin@admin.com",
  role: UserRoleEnum.Admin,
  iat: 0,
  exp: 0,
  aud: "",
  iss: "",
};

export const mockAuthGuard = (user = defaultAuthGuardPayload) => ({
  canActivate: (context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: RequestJWTPayload }>();
    request.user = user;
    return true;
  },
});
