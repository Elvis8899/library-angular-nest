import { AuthResponse, contractRef, LoginRequest } from "@library/contracts";
import { LoginCommand } from "@modules/auth/commands/login/login.command";
import { WrongAuthException } from "@modules/auth/domain/auth.errors";
import { LoginThrottlerGuard } from "@modules/auth/guards/loginThrottler.guard";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@Controller("v1/")
@ApiTags("Login")
export class LoginController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("login")
  @ApiErrors(WrongAuthException)
  @UseGuards(LoginThrottlerGuard)
  @ApiBody({ schema: contractRef(LoginRequest) })
  @ApiOperation({ summary: "Login a user" })
  @Answers(AuthResponse, {
    description:
      "Authentication a user with email and password credentials and return token",
  })
  @ApiTooManyRequestsResponse({
    description: "Muitas tentativas de login para este email.",
  })
  public async login(@Body() loginDto: LoginRequest) {
    return this.commandBus.execute(new LoginCommand(loginDto));
  }
}
