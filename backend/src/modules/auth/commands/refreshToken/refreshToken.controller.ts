import {
  AuthResponse,
  contractRef,
  RefreshTokenRequest,
} from "@library/contracts";
import { RefreshTokenCommand } from "@modules/auth/commands/refreshToken/refreshToken.command";
import { InvalidRefreshTokenException } from "@modules/auth/domain/auth.errors";
import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@Controller("v1/")
@ApiTags("Login")
export class RefreshTokenController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("refresh")
  @ApiErrors(InvalidRefreshTokenException)
  @ApiBody({ schema: contractRef(RefreshTokenRequest) })
  @ApiOperation({ summary: "Renovar tokens de acesso" })
  @Answers(AuthResponse, {
    description: "Retorna novos tokens a partir de um token de atualização",
  })
  public async refresh(@Body() refreshTokenDto: RefreshTokenRequest) {
    return this.commandBus.execute(new RefreshTokenCommand(refreshTokenDto));
  }
}
