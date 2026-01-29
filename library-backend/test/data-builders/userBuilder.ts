import { FPF } from "@shared/functional/monads";
import { UUID } from "@shared/uuid/entities/uuid";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { User, UserRoleEnum } from "@user/domain/user.entity";
import { formatToCPF } from "@user/domain/value-object/document";
import { CreateUserDto } from "@user/dtos/user.dto";
import { z } from "zod";

export class UserBuilder {
  private id = UUID.parse(createTestId(TableNameEnum.User, 0));

  private name = "usuario 1";
  private email = "userone@example.com";
  private password = "123456";
  private cpf = formatToCPF("12345678901");
  private role: UserRoleEnum = UserRoleEnum.Client;

  private defaultProperties: z.input<typeof User>;
  private overrides: z.input<typeof User>;

  constructor(index?: number) {
    if (index) {
      this.name = "usuario " + index.toString();
      this.id = createTestId(TableNameEnum.User, index);
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
    this.overrides.email = email;
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
