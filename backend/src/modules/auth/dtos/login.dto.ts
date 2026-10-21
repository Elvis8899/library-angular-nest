import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "Email do Usuario",
    required: true,
  })
  email!: string;
  @ApiProperty({
    description: "Senha do Usuario",
    required: true,
  })
  password!: string;
}
