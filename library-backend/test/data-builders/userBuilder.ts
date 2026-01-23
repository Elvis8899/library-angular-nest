import { User, UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { formatToCPF } from "@src/modules/user/domain/value-object/document";
import { CreateUserDto } from "@src/modules/user/dtos/user.dto";
import { FPF } from "@src/shared/functional/monads";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";

export class UserBuilder {
  private id = UUID.parse("b8a11695-3c71-45b4-9dd8-14900412f4e1");

  private name = "usuario 1";
  private email = "7XhHs@example.com";
  private password = "123456";
  private cpf = formatToCPF("12345678901");
  private role: UserRoleEnum = UserRoleEnum.Client;

  private defaultProperties: z.input<typeof User>;
  private overrides: z.input<typeof User>;

  constructor(index?: number) {
    if (index) {
      this.name = "usuario " + index;
      this.id =
        "00000000-0000-0000-0001-" +
        (index * 1e-12).toFixed(12).replace("0.", "");
    }
    this.defaultProperties = {
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      cpf: this.cpf,
      role: this.role,
    };
    this.overrides = {
      ...this.defaultProperties,
    };
  }

  reset() {
    this.overrides = {
      ...this.defaultProperties,
    };
    return this;
  }

  withId(id: string) {
    this.overrides.id = id;
    return this;
  }

  withName(name: string) {
    this.overrides.name = name;
    return this;
  }

  withCPF(cpf: string) {
    this.overrides.cpf = formatToCPF(cpf);
    return this;
  }

  withEmail(email: string) {
    this.overrides.email = formatToCPF(email);
    return this;
  }

  withPassword(password: string) {
    this.overrides.password = password;
    return this;
  }

  withRole(role: UserRoleEnum) {
    this.overrides.role = role;
    return this;
  }

  build(): User {
    return User.parse({
      ...this.defaultProperties,
      ...this.overrides,
    });
  }
  buildCreateDTO(): CreateUserDto {
    const user = {
      ...this.defaultProperties,
      ...this.overrides,
    };

    return FPF.unsafeCoerce({
      ...user,
    });
  }
}
