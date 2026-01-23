import { Expose } from 'class-transformer';
import { InitializableEntity } from '@app/@core/entities/utils/intializable.entity';
import { ROLE } from '@app/auth';

export class Credentials extends InitializableEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: ROLE;
  };

  @Expose({ name: 'access_token' })
  accessToken = '';

  @Expose({ name: 'refresh_token' })
  refreshToken = '';

  roles: string[] = [];

  constructor(init?: Partial<Credentials>) {
    super(init);
    this.initEntity(init);
  }

  get fullName() {
    return this.user?.name || '';
  }
}
