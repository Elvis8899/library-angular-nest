import { UserDto } from "@modules/user/dtos/user.dto";
import { PickType } from "@nestjs/swagger";

export class LoginDto extends PickType(UserDto, [
  "email",
  "password",
] as const) {}
