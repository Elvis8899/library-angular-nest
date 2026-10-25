import {
  AuthResponse,
  contractRef,
  RefreshTokenRequest,
  Sent,
} from "@library/contracts";
import { RefreshTokenCommand } from "@modules/auth/commands/refreshToken/refreshToken.command";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

@Controller("v1/")
@ApiTags("Login")
export class RefreshTokenController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: contractRef(RefreshTokenRequest) })
  @ApiOperation({ summary: "Renovar tokens de acesso" })
  @ApiOkResponse({
    description: "Retorna novos tokens a partir de um token de atualização",
    schema: contractRef(AuthResponse),
  })
  @ApiUnauthorizedResponse({ description: "Token de atualização inválido." })
  public async refresh(
    @Body() refreshTokenDto: RefreshTokenRequest,
  ): Promise<Sent<typeof AuthResponse>> {
    return this.commandBus.execute<
      RefreshTokenCommand,
      Sent<typeof AuthResponse>
    >(new RefreshTokenCommand(refreshTokenDto));
  }
}
