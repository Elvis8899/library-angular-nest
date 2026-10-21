import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { BaseEntityDto } from "@shared/utils/dtos/baseEntity.dto";

// The logged-in user, declared here so auth depends only on the user
// module's entity and repository
class AuthUserDto extends PickType(BaseEntityDto, ["id"] as const) {
  @ApiProperty({
    description: "Nome do Usuario",
    required: true,
  })
  name!: string;
  @ApiProperty({
    description: "Email do Usuario",
    required: true,
  })
  email!: string;
  @ApiProperty({
    description: "Role do Usuario",
    required: true,
    enum: UserRoleEnum,
  })
  role!: UserRoleEnum;
}

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
