import { ApiProperty, OmitType } from "@nestjs/swagger";
import { PaginatedResponseDto } from "@src/shared/api/paginated.response.base";
import { BaseEntityDto } from "@src/shared/utils/baseEntity.dto";

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

export class PaginatedBookInfoResponseDto extends PaginatedResponseDto<BookInfoDto> {
  @ApiProperty({ type: BookInfoDto, isArray: true })
  readonly data!: readonly BookInfoDto[];
}
