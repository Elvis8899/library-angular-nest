import {
  AuthResponse,
  contractRef,
  LoginRequest,
  Sent,
} from "@library/contracts";
import { LoginCommand } from "@modules/auth/commands/login/login.command";
import { WrongAuthException } from "@modules/auth/domain/auth.errors";
import { LoginThrottlerGuard } from "@modules/auth/guards/loginThrottler.guard";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@Controller("v1/")
@ApiTags("Login")
export class LoginController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("login")
  @ApiErrors(WrongAuthException)
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @ApiBody({ schema: contractRef(LoginRequest) })
  @ApiOperation({ summary: "Login a user" })
  @ApiOkResponse({
    description:
      "Authentication a user with email and password credentials and return token",
  })
  @ApiTooManyRequestsResponse({
    description: "Muitas tentativas de login para este email.",
  })
  public async login(
    @Body() loginDto: LoginRequest,
  ): Promise<Sent<typeof AuthResponse>> {
    return this.commandBus.execute<LoginCommand, Sent<typeof AuthResponse>>(
      new LoginCommand(loginDto),
    );
  }
}
