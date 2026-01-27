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
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { BookRentalDto } from "../../dtos/bookRental.dto";
import { RentBookCommand } from "./rentBook.command";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { RolesGuard } from "@src/modules/auth/guards/roles.guard";
import { Roles } from "@src/modules/auth/decorators/roles.decorator";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { AuthenticatedRequest } from "@src/modules/auth/domain/login.entity";

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
