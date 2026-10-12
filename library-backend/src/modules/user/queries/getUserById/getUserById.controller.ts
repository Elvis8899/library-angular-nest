import { Roles } from "@auth/decorators/roles.decorator";
import { AuthGuard } from "@auth/guards/auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
import { Controller, Get, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { User, UserRoleEnum } from "@user/domain/user.entity";
import { toUserResponse, UserResponseDto } from "@user/dtos/user.dto";
import { GetUserByIdQuery } from "@user/queries/getUserById/getUserById.query";

@Controller("v1/")
@ApiTags("Usuários")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class GetUserByIdController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("users/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Encontrar um usuário pelo ID" })
  @ApiNotFoundResponse({ description: "Usuário não encontrado." })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponseDto,
  })
  async paginatedUsers(@Param("id") id: string): Promise<UserResponseDto> {
    return this.queryBus
      .execute<GetUserByIdQuery, User>(new GetUserByIdQuery(id))
      .then(toUserResponse);
  }
}
