import { RentBookRequest } from "@library/contracts";
import {
  BookRental,
  BookRentalDetails,
  dueDateOf,
  rentalDetailsOf,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import { FPF } from "@shared/utils/application/monads";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { FakeClock } from "@test/util/fakeClock";
import { z } from "zod";

export class BookRentalBuilder {
  private id!: string;

  private rentalStatus = RentalStatusEnum.Rented;
  private bookItemId = createTestId(TableNameEnum.BookItem, 0);
  private userId = createTestId(TableNameEnum.User, 0);

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
      // Rented at the FakeClock's instant
      overdueDate: dueDateOf(new FakeClock().now()),
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

  withBookItemId(bookItemId: string) {
    this.overrides.bookItemId = bookItemId;
    return this;
  }

  withUserId(userId: string) {
    this.overrides.userId = userId;
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

  /** The rental as the list shows it, with its fines at the FakeClock's
   * instant. */
  buildRentalDetails(): BookRentalDetails {
    return rentalDetailsOf(new FakeClock().now())(this.build());
  }
  buildCreateDTO(): RentBookRequest {
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
