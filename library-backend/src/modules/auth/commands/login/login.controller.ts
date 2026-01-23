import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { LoginCommand } from "./login.command";
import { LoginDto } from "../../dtos/login.dto";
import { AuthResponseDto } from "../../dtos/authResponse.dto";

@Controller("v1/")
@ApiTags("Login")
export class LoginController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login a user" })
  @ApiOkResponse({
    description:
      "Authentication a user with email and password credentials and return token",
  })
  @ApiUnauthorizedResponse({ description: "Forbidden" })
  public async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.commandBus.execute<LoginCommand>(new LoginCommand(loginDto));
  }
}
