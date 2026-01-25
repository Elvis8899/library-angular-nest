import { Expose } from "class-transformer";
import { InitializableEntity } from "@app/@core/entities/utils/intializable.entity";

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
