import { ApiProperty } from "@nestjs/swagger";

export class BaseEntityDto {
  @ApiProperty({
    description: "ID",
    example: "01606052-f270-4d03-b719-9a2b78f99843",
    required: true,
  })
  id!: string;

  @ApiProperty({
    description: "Data de criação",
    example: "2021-01-01T00:00:00.000Z",
    required: true,
  })
  createdAt?: string | Date;

  @ApiProperty({
    description: "Data de atualização",
    example: "2021-01-01T00:00:00.000Z",
    required: true,
  })
  updatedAt?: string | Date;
}
