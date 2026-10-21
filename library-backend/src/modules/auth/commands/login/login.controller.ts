import { LoginCommand } from "@modules/auth/commands/login/login.command";
import { AuthResponseDto } from "@modules/auth/dtos/authResponse.dto";
import { LoginDto } from "@modules/auth/dtos/login.dto";
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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

@Controller("v1/")
@ApiTags("Login")
export class LoginController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({ summary: "Login a user" })
  @ApiOkResponse({
    description:
      "Authentication a user with email and password credentials and return token",
  })
  @ApiUnauthorizedResponse({ description: "Forbidden" })
  @ApiTooManyRequestsResponse({
    description: "Muitas tentativas de login para este email.",
  })
  public async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.commandBus.execute<LoginCommand, AuthResponseDto>(
      new LoginCommand(loginDto),
    );
  }
}
