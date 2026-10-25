import { ApiProperty } from "@nestjs/swagger";
import { PaginatedQueryRequestDto } from "@shared/utils/dtos/paginatedQuery.request.dto";

// The list's query parameters, for Swagger (the request and response bodies
// are the contracts')
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
