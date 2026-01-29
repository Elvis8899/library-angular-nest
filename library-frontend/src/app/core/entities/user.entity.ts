import { ROLE } from "@app/auth";
import { BaseEntity } from "@app/core/entities/utils";

export class UserEntity extends BaseEntity {
  name = "";
  email = "";
  cpf = "";
  role: ROLE = ROLE.GUEST;
  password = "";
}
