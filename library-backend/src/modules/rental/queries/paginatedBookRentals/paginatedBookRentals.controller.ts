import { AuthenticatedRequest } from "@auth/domain/login.entity";
import { AuthGuard } from "@auth/guards/auth.guard";
import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  BookRentalDetails,
  RentalStatusEnum,
} from "@rental/domain/bookRental.entity";
import { PaginatedBookRentalResponseDto } from "@rental/dtos/bookRental.dto";
import { PaginatedBookRentalsQuery } from "@rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { PaginatedQueryRequestDto } from "@shared/api/paginated-query.request.dto";
import { Paginated } from "@shared/ddd";
import { UserRoleEnum } from "@user/domain/user.entity";

@Controller("v1/bookRentals")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Empréstimos")
export class PaginatedBookRentalsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("")
  @ApiOperation({ summary: "Listar Empréstimos de livros" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedBookRentalResponseDto,
  })
  async paginatedBookRentals(
    @Query() queryParams: PaginatedQueryRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedBookRentalResponseDto> {
    const { user } = req;
    const userId = user.role === UserRoleEnum.Admin ? undefined : user.sub;
    const status = RentalStatusEnum.Rented;
    return this.queryBus
      .execute<
        PaginatedBookRentalsQuery,
        Paginated<BookRentalDetails>
      >(new PaginatedBookRentalsQuery(queryParams, status, userId))
      .then((result) => new PaginatedBookRentalResponseDto(result));
  }
}
