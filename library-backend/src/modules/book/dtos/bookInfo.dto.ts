import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { PaginatedResponseDto } from "@shared/api/paginated.response.base";
import { BaseEntityDto } from "@shared/utils/baseEntity.dto";

export class BookInfoDto extends BaseEntityDto {
  @ApiProperty({
    description: "Nome do Livro",
    required: true,
  })
  name!: string;
  @ApiProperty({
    description: "URL imagem do Livro",
    required: true,
  })
  image!: string;
  @ApiProperty({
    description: "Preço do Livro",
    required: true,
  })
  price!: number;
}

export class CreateBookInfoDto extends OmitType(BookInfoDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {}

export class BookItemDto extends BaseEntityDto {
  @ApiProperty({
    description: "ID do exemplar",
    required: true,
  })
  id!: string;
  @ApiProperty({
    description: "Status do exemplar",
    required: false,
  })
  status?: BookItemStatusEnum;
  @ApiProperty({
    description: "Id do Livro do Exemplar",
    required: true,
  })
  bookId!: string;
}

export class CreateBookItemDto extends OmitType(BookItemDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {}

export class PaginatedBookInfoResponseDto extends PaginatedResponseDto<BookInfoDto> {
  @ApiProperty({ type: BookInfoDto, isArray: true })
  data!: BookInfoDto[];
}
