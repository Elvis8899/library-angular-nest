import { Expose } from "class-transformer";

export class BaseEntity {
  id = "";

  @Expose({ name: "created_at" })
  createdAt = "";

  @Expose({ name: "updated_at" })
  updatedAt = "";
}
