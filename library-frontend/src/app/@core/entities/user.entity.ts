import { ROLE } from '@app/auth';

export class UserEntity {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: ROLE;
  password: string;
}
