import { InitializableEntity } from "@app/@core/entities/utils/intializable.entity";
import { ROLE } from "@app/auth";
import { Expose } from "class-transformer";

export class Credentials extends InitializableEntity {
  user: {
    id: string;
    name: string;
    email: string;
    role: ROLE;
  } = {
    id: "",
    name: "",
    email: "",
    role: ROLE.GUEST,
  };

  @Expose({ name: "access_token" })
  accessToken = "";

  @Expose({ name: "refresh_token" })
  refreshToken = "";

  constructor(init?: Partial<Credentials>) {
    super(init);
    this.initEntity(init);
  }

  get fullName() {
    return this.user?.name || "";
  }
}
