import { ROLE } from "@app/models/credentials.entity";
import { BaseEntity } from "@app/models/utils/base.entity";

export interface UserEntity extends BaseEntity {
  name: string;
  email: string;
  cpf: string;
  role: ROLE;
  password: string;
}
