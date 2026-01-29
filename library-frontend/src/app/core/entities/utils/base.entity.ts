import { InitializableEntity } from "@app/core/entities/utils/intializable.entity";
import { Expose } from "class-transformer";

export class BaseEntity extends InitializableEntity {
  id = "";

  @Expose({ name: "created_at" })
  createdAt = "";

  @Expose({ name: "updated_at" })
  updatedAt = "";

  constructor(init?: Partial<BaseEntity>) {
    super(init);
    this.initEntity(init);
  }
}
