import { ROLE } from "@app/models/credentials.entity";
import { BaseEntity } from "@app/models/utils/base.entity";

export class UserEntity extends BaseEntity {
  name = "";
  email = "";
  cpf = "";
  role: ROLE = ROLE.GUEST;
  password = "";
}
