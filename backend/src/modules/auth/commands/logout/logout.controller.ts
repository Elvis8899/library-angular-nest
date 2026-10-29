import { LogoutCommand } from "@modules/auth/commands/logout/logout.command";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { HttpCode, HttpStatus, Post, Request } from "@nestjs/common";
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";

@ApiController("Login")
export class LogoutController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Encerrar sessão",
    description:
      "Revoga todos os tokens de atualização do usuário. Tokens de acesso continuam válidos até expirar.",
  })
  @ApiNoContentResponse({ description: "Sessão encerrada." })
  @ApiUnauthorizedResponse({ description: "Token de acesso inválido." })
  public async logout(@Request() req: AuthenticatedRequest): Promise<void> {
    return this.commandBus.execute(new LogoutCommand(req.user.sub));
  }
}
