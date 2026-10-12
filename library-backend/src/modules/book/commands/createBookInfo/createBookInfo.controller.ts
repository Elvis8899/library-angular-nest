import { Roles } from "@auth/decorators/roles.decorator";
import { AuthGuard } from "@auth/guards/auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
import { CreateBookInfo } from "@book/commands/createBookInfo/createBookInfo.command";
import { CreateBookInfoDto } from "@book/dtos/bookInfo.dto";
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
import { UserRoleEnum } from "@user/domain/user.entity";

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
