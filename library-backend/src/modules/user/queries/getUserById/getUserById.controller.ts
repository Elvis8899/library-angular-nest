import { Controller, Get, HttpStatus, Param } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { UserDto } from "../../dtos/user.dto";
import { GetUserByIdQuery } from "./getUserById.query";

@Controller("v1/")
@ApiTags("Usuários")
export class GetUserByIdController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("users/:id")
  @ApiOperation({ summary: "Encontrar um usuário pelo ID" })
  @ApiNotFoundResponse({ description: "Usuário não encontrado." })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDto,
  })
  async paginatedUsers(@Param("id") id: string): Promise<UserDto> {
    return this.queryBus
      .execute<GetUserByIdQuery>(new GetUserByIdQuery(id))
      .then((result) => result);
  }
}
