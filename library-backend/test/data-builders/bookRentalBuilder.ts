import {
  BookRental,
  BookRentalDetails,
  RentalStatusEnum,
} from "@src/modules/rental/domain/bookRental.entity";
import { CreateBookRentalDto } from "@src/modules/rental/dtos/bookRental.dto";
import { FPF } from "@src/shared/functional/monads";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { z } from "zod";

export class BookRentalBuilder {
  private id = UUID.parse("b8a11695-3c71-45b4-9dd8-14900412f4e1");

  private rentalStatus = RentalStatusEnum.Rented;
  private bookItemId = "b8a11695-3c71-45b4-9dd8-14900412f4e1";
  private userId = "b8a11695-3c71-45b4-9dd8-14900412f4e1";

  // private overdueDate = undefined;
  // private deliveryDate = undefined;
  //private bookItem = "";
  // private user = "";

  private defaultProperties: z.input<typeof BookRental>;
  private overrides: z.input<typeof BookRental>;

  constructor(index?: number) {
    if (index) {
      this.id =
        "00000000-0000-0000-0001-" +
        (index * 1e-12).toFixed(12).replace("0.", "");
    }
    this.defaultProperties = {
      id: this.id,
      rentalStatus: this.rentalStatus,
      bookItemId: this.bookItemId,
      userId: this.userId,
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

  withUserId(userId: string) {
    this.overrides.userId = userId;
    return this;
  }

  withBookItemId(bookItemId: string) {
    this.overrides.bookItemId = bookItemId;
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
    const user = {
      ...this.defaultProperties,
      ...this.overrides,
    };

    return FPF.unsafeCoerce({
      ...user,
    });
  }
}
