import {
  BookRental,
  BookRentalDetails,
  RentalStatusEnum,
} from "@src/modules/rental/domain/bookRental.entity";
import { CreateBookRentalDto } from "@src/modules/rental/dtos/bookRental.dto";
import { FPF } from "@src/shared/functional/monads";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { z } from "zod";

export class BookRentalBuilder {
  private id!: string;

  private rentalStatus = RentalStatusEnum.Rented;
  private bookItemId = createTestId(TableNameEnum.BookItem, 0);
  private userId = createTestId(TableNameEnum.User, 0);

  // private overdueDate = undefined;
  // private deliveryDate = undefined;
  private bookItem = undefined;
  private user = undefined;

  private defaultProperties: z.input<typeof BookRental>;
  private overrides: z.input<typeof BookRental>;

  constructor(index = 0) {
    this.id = createTestId(TableNameEnum.BookRentalDetails, index);
    this.defaultProperties = {
      id: this.id,
      rentalStatus: this.rentalStatus,
      bookItemId: this.bookItemId,
      userId: this.userId,
      bookItem: this.bookItem,
      user: this.user,
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

  withStatus(status: RentalStatusEnum) {
    this.overrides.rentalStatus = status;
    return this;
  }

  withOverdueDate(overdueDate: Date) {
    this.overrides.overdueDate = overdueDate;
    return this;
  }

  withCreatedAt(createdAt: Date) {
    this.overrides.createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date) {
    this.overrides.updatedAt = updatedAt;
    return this;
  }

  withBookItem(bookItem?: { book: { name: string; price: number } }) {
    this.overrides.bookItem = bookItem;
    return this;
  }

  withUser(user?: { name: string }) {
    this.overrides.user = user;
    return this;
  }

  build(): BookRental {
    return BookRental.parse({
      ...this.defaultProperties,
      ...this.overrides,
    });
  }

  buildRentalDetails(): BookRentalDetails {
    return BookRentalDetails.parse({
      ...this.defaultProperties,
      ...this.overrides,
    });
  }
  buildCreateDTO(): CreateBookRentalDto {
    const rental = {
      ...this.defaultProperties,
      ...this.overrides,
    };
    return FPF.unsafeCoerce({
      ...rental,
      id: undefined,
    });
  }
}
