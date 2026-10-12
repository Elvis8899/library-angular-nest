import { Roles } from "@auth/decorators/roles.decorator";
import { AuthGuard } from "@auth/guards/auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
import { UpdateBookInfo } from "@book/commands/updateBookInfo/updateBookInfo.command";
import { CreateBookInfoDto } from "@book/dtos/bookInfo.dto";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { UserRoleEnum } from "@user/domain/user.entity";

@Controller("v1/")
@ApiTags("Livros")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class UpdateBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put("bookInfos/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: "Livro atualizado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiNotFoundResponse({ description: "Livro não encontrado." })
  @ApiOperation({ summary: "Atualizar Livro" })
  async updateBookInfo(
    @Body() updateModuleDto: CreateBookInfoDto,
    @Param("id") id: string,
  ): Promise<void> {
    return this.commandBus
      .execute(new UpdateBookInfo(updateModuleDto, id))
      .then(noop);
  }
}
