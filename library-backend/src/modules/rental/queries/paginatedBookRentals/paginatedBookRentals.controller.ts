import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { PaginatedBookRentalResponseDto } from "../../dtos/bookRental.dto";
import { PaginatedQueryRequestDto } from "@src/shared/api/paginated-query.request.dto";
import { PaginatedBookRentalsQuery } from "./paginatedBookRentals.query";
import { RentalStatusEnum } from "../../domain/bookRental.entity";

@Controller("v1/bookRentals")
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
  ): Promise<PaginatedBookRentalResponseDto> {
    const userId = undefined;
    const status = RentalStatusEnum.Rented;
    return this.queryBus
      .execute<PaginatedBookRentalsQuery>(
        new PaginatedBookRentalsQuery(queryParams, status, userId),
      )
      .then((result) => new PaginatedBookRentalResponseDto(result));
  }
}
