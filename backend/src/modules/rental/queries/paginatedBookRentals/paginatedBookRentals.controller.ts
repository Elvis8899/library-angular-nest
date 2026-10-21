import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import {
  BookRentalDetails,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import { PaginatedBookRentalResponseDto } from "@modules/rental/dtos/bookRental.dto";
import { PaginatedBookRentalsQuery } from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
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
import { Paginated } from "@shared/utils/database/repository.port";
import { PaginatedQueryRequestDto } from "@shared/utils/dtos/paginatedQuery.request.dto";

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
      .execute<PaginatedBookRentalsQuery, Paginated<BookRentalDetails>>(
        new PaginatedBookRentalsQuery(queryParams, status, userId),
      )
      .then((result) => new PaginatedBookRentalResponseDto(result));
  }
}
