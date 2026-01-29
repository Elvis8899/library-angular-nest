import { Roles } from "@auth/decorators/roles.decorator";
import { AuthenticatedRequest } from "@auth/domain/login.entity";
import { AuthGuard } from "@auth/guards/auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
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
import { RentBookCommand } from "@rental/commands/rentBook/rentBook.command";
import { BookRentalDto } from "@rental/dtos/bookRental.dto";
import { noop } from "@shared/utils/noop";
import { UserRoleEnum } from "@user/domain/user.entity";

@Controller("v1/bookRentals")
@ApiTags("Empréstimos")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class RentBookController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("rent")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin, UserRoleEnum.Client)
  @ApiOperation({
    summary: "Fazer empréstimo de Livro.",
    description: `Dado um Livro válido, ele será emprestado.`,
  })
  @ApiCreatedResponse({ description: "Empréstimo criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiConflictResponse({ description: "Livro já está emprestado." })
  async createBookInfo(
    @Body() bookRentalInput: BookRentalDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    if (req.user.role !== UserRoleEnum.Admin) {
      bookRentalInput.userId = req.user.sub;
    }
    return this.commandBus
      .execute<RentBookCommand>(new RentBookCommand(bookRentalInput))
      .then(noop);
  }
}
