import { BookInfo } from "@src/modules/book/domain/bookInfo.entity";
import { CreateBookInfoDto } from "@src/modules/book/dtos/bookInfo.dto";
import { FPF } from "@src/shared/functional/monads";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";

export class BookInfoBuilder {
  private id = UUID.parse("b8a11695-3c71-45b4-9dd8-14900412f4e1");

  private name = "livro 1";
  private image = "7XhHs@example.com";
  private price = 100;

  private defaultProperties: z.input<typeof BookInfo>;
  private overrides: z.input<typeof BookInfo>;

  constructor(index?: number) {
    if (index) {
      this.name = "livro " + index;
      this.id =
        "00000000-0000-0000-0001-" +
        (index * 1e-12).toFixed(12).replace("0.", "");
    }
    this.defaultProperties = {
      id: this.id,
      name: this.name,
      image: this.image,
      price: this.price,
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

  build(): BookInfo {
    return BookInfo.parse({
      ...this.defaultProperties,
      ...this.overrides,
    });
  }
  buildCreateDTO(): CreateBookInfoDto {
    const user = {
      ...this.defaultProperties,
      ...this.overrides,
    };

    return FPF.unsafeCoerce({
      ...user,
    });
  }
}
