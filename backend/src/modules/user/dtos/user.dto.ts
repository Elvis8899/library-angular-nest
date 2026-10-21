import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { BaseEntityDto } from "@shared/utils/dtos/baseEntity.dto";
import { PaginatedResponseDto } from "@shared/utils/dtos/paginated.response.base";

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
    default: UserRoleEnum.Client,
  })
  role!: UserRoleEnum;
}

export class CreateUserDto extends OmitType(UserDto, [
  "id",
  "createdAt",
  "updatedAt",
]) {}

// The password is kept when left out
export class UpdateUserDto extends IntersectionType(
  OmitType(CreateUserDto, ["password"]),
  PartialType(PickType(CreateUserDto, ["password"])),
) {}

export class UserResponseDto extends OmitType(UserDto, ["password"]) {}

export const toUserResponse = ({
  password: _password,
  tokenVersion: _tokenVersion,
  ...user
}: User): UserResponseDto => user;

export class PaginatedUserResponseDto extends PaginatedResponseDto<UserResponseDto> {
  @ApiProperty({ type: UserResponseDto, isArray: true })
  data!: UserResponseDto[];
}
