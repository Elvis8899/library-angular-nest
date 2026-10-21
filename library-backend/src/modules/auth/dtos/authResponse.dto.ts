import { UserDto } from "@modules/user/dtos/user.dto";
import { ApiProperty, PickType } from "@nestjs/swagger";

class AuthUserDto extends PickType(UserDto, [
  "id",
  "name",
  "email",
  "role",
] as const) {}

export class AuthResponseDto {
  @ApiProperty({
    description: "Token de acesso",
    required: true,
  })
  accessToken!: string;
  @ApiProperty({
    description: "Token de atualização",
    required: true,
  })
  refreshToken!: string;

  @ApiProperty({
    description: "Usuário",
    required: true,
  })
  user!: AuthUserDto;
}
