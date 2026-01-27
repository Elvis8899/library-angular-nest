import { BookInfo } from "@src/modules/book/domain/bookInfo.entity";
import { BookItemStatusEnum } from "@src/modules/book/domain/value-object/bookItem.entity";
import { CreateBookInfoDto } from "@src/modules/book/dtos/bookInfo.dto";
import { FPF } from "@src/shared/functional/monads";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { z } from "zod";

export class BookInfoBuilder {
  private id = UUID.parse(createTestId(TableNameEnum.BookInfo, 0));

  private name = "livro 1";
  private image = "user0@example.com";
  private price = 100;
  private bookItems = [
    {
      id: createTestId(TableNameEnum.BookItem, 0),
      status: BookItemStatusEnum.Available,
      bookId: this.id,
    },
  ];

  private defaultProperties: z.input<typeof BookInfo>;
  private overrides: z.input<typeof BookInfo>;

  constructor(index?: number) {
    if (index) {
      this.name = "livro " + index;
      this.id = createTestId(TableNameEnum.BookInfo, index);
    }
    this.defaultProperties = {
      id: this.id,
      name: this.name,
      image: this.image,
      price: this.price,
      bookItems: this.bookItems,
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

  withBookItems(bookItems: z.input<typeof BookInfo>["bookItems"]) {
    this.overrides.bookItems = bookItems;
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
