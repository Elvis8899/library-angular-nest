import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { RentBookCommand } from "@modules/rental/commands/rentBook/rentBook.command";
import { BookRentalDto } from "@modules/rental/dtos/bookRental.dto";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
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
import { noop } from "@shared/utils/application/noop";

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
