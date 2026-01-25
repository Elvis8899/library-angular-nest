import { ApiProperty, OmitType } from "@nestjs/swagger";
import { PaginatedResponseDto } from "@src/shared/api/paginated.response.base";
import { BaseEntityDto } from "@src/shared/utils/baseEntity.dto";
import { UserRoleEnum } from "../domain/user.entity";

export class UserDto extends BaseEntityDto {
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
    description: "Senha do Usuario",
    required: true,
  })
  password!: string;
  @ApiProperty({
    description: "CPF do Usuario. Necessário caso seja cliente",
    required: true,
  })
  cpf!: string;
  @ApiProperty({
    description: "Role do Usuario",
    required: true,
    enum: UserRoleEnum,
    default: UserRoleEnum["Client"],
  })
  role!: UserRoleEnum;
}

export class CreateUserDto extends OmitType(UserDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {}

export class PaginatedUserResponseDto extends PaginatedResponseDto<UserDto> {
  @ApiProperty({ type: UserDto, isArray: true })
  data!: UserDto[];
}
