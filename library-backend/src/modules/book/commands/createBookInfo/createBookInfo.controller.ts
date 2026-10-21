import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { CreateBookInfo } from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { CreateBookInfoDto } from "@modules/book/dtos/bookInfo.dto";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
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
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";

@Controller("v1/")
@ApiTags("Livros")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class CreateBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("bookInfos")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Cria um Livro.",
    description: `Dado um Livro válido, ele será criado.`,
  })
  @ApiCreatedResponse({ description: "Livro criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiConflictResponse({ description: "Livro já existe." })
  async createBookInfo(
    @Body() createBookInfoDto: CreateBookInfoDto,
  ): Promise<void> {
    return this.commandBus
      .execute<CreateBookInfo>(new CreateBookInfo(createBookInfoDto))
      .then(noop);
  }
}
