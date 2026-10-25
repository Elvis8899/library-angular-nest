import {
  AuthResponse,
  contractRef,
  RefreshTokenRequest,
  Sent,
} from "@library/contracts";
import { RefreshTokenCommand } from "@modules/auth/commands/refreshToken/refreshToken.command";
import { InvalidRefreshTokenException } from "@modules/auth/domain/auth.errors";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@Controller("v1/")
@ApiTags("Login")
export class RefreshTokenController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("refresh")
  @ApiErrors(InvalidRefreshTokenException)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: contractRef(RefreshTokenRequest) })
  @ApiOperation({ summary: "Renovar tokens de acesso" })
  @ApiOkResponse({
    description: "Retorna novos tokens a partir de um token de atualização",
    schema: contractRef(AuthResponse),
  })
  public async refresh(
    @Body() refreshTokenDto: RefreshTokenRequest,
  ): Promise<Sent<typeof AuthResponse>> {
    return this.commandBus.execute<
      RefreshTokenCommand,
      Sent<typeof AuthResponse>
    >(new RefreshTokenCommand(refreshTokenDto));
  }
}
