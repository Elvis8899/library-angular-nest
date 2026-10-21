import { BookItemStatusEnum } from "@book/domain/valueObject/bookItem.entity";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { BaseEntityDto } from "@shared/utils/dtos/baseEntity.dto";
import { PaginatedResponseDto } from "@shared/utils/dtos/paginated.response.base";
import { PaginatedQueryRequestDto } from "@shared/utils/dtos/paginatedQuery.request.dto";
import { BookInfo } from "@src/modules/book/domain/bookInfo.entity";

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
  declare id: string;
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
export const toBookInfoResponse = (bookInfo: BookInfo): BookInfoDto => ({
  ...bookInfo,
});

export class CreateBookItemDto extends OmitType(BookItemDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {}

export class PaginatedBookInfoQueryRequestDto extends PaginatedQueryRequestDto {
  @ApiProperty({
    example: "dom casmurro",
    description:
      "Filtra pelos livros cujo nome contém este texto, sem diferenciar maiúsculas",
    required: false,
  })
  readonly name?: string;

  @ApiProperty({
    example: "2026-10-13T03:00:00.000Z",
    description:
      "Só livros criados a partir deste instante (inclusive), em ISO 8601",
    required: false,
  })
  readonly createdFrom?: string;

  @ApiProperty({
    example: "2026-10-14T03:00:00.000Z",
    description:
      "Só livros criados antes deste instante (exclusive), em ISO 8601",
    required: false,
  })
  readonly createdBefore?: string;

  @ApiProperty({
    enum: ["name", "createdAt"],
    default: "createdAt",
    description: "Campo de ordenação",
    required: false,
  })
  readonly sortBy?: string;

  @ApiProperty({
    enum: ["asc", "desc"],
    default: "desc",
    description: "Direção da ordenação",
    required: false,
  })
  readonly order?: string;
}

export class PaginatedBookInfoResponseDto extends PaginatedResponseDto<BookInfoDto> {
  @ApiProperty({ type: BookInfoDto, isArray: true })
  data!: BookInfoDto[];
}
