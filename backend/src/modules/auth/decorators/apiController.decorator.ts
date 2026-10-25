import { AuthGuard } from "@modules/auth/guards/auth.guard";
import {
  applyDecorators,
  CanActivate,
  Controller,
  Type,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

/**
 * A use case's controller: under `v1/`, in Swagger's `tag`, behind the
 * Bearer token (`AuthGuard`) and then any other guards given, which apply to
 * every route of the class:
 *
 *   @ApiController("Usuários", RolesGuard)
 */
export const ApiController = (
  tag: string,
  ...guards: Type<CanActivate>[]
): ClassDecorator =>
  applyDecorators(
    Controller("v1/"),
    ApiTags(tag),
    ApiBearerAuth(),
    UseGuards(AuthGuard, ...guards),
  );
