import { ApiProperty, OmitType } from "@nestjs/swagger";
import { RentalStatus } from "@prisma/client";
import { PaginatedQueryRequestDto } from "@shared/api/paginated-query.request.dto";
import { PaginatedResponseDto } from "@shared/api/paginated.response.base";
import { BaseEntityDto } from "@shared/utils/baseEntity.dto";

export class BookRentalDto extends BaseEntityDto {
  @ApiProperty({
    description: "Id do Exemplar de Livro",
    required: true,
  })
  bookItemId!: string;
  @ApiProperty({
    description: "Id do Usuário",
    required: true,
  })
  userId!: string;
  @ApiProperty({
    description: "Data de entrega",
    example: "2021-01-01T00:00:00.000Z",
    required: true,
  })
  overdueDate!: string | Date;
  @ApiProperty({
    description: "Data entregue",
    example: "2021-01-01T00:00:00.000Z",
    required: true,
  })
  deliveryDate?: string | Date;
  @ApiProperty({
    description: "Status da Locação",
    required: true,
    enum: RentalStatus,
    default: RentalStatus.rented,
  })
  rentalStatus!: RentalStatus;
}

export class CreateBookRentalDto extends OmitType(BookRentalDto, [
  "id",
  "createdAt",
  "updatedAt",
  "overdueDate",
  "deliveryDate",
  "rentalStatus",
]) {}

export class PaginatedBookRentalResponseDto extends PaginatedResponseDto<BookRentalDto> {
  @ApiProperty({ type: BookRentalDto, isArray: true })
  data!: BookRentalDto[];
}

export class PaginatedBookRentalQueryPaginationDto extends PaginatedQueryRequestDto {
  @ApiProperty({
    description: "Id do Usuário",
    required: true,
  })
  userId?: string;
}
