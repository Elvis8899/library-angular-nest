import { ChangeBookItemStatus } from "@book/commands/changeBookItemStatus/changeBookItemStatus.command";
import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { OnEvent } from "@nestjs/event-emitter";
import {
  BOOK_RENTAL_RENTED,
  BookRentalRentedEvent,
} from "@rental/domain/events/bookRented.event";

@Injectable()
export class BookRentSubscriber {
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent(BOOK_RENTAL_RENTED)
  async afterBookRentalEvent(
    payload: BookRentalRentedEvent["payload"],
  ): Promise<void> {
    const command = new ChangeBookItemStatus(
      payload.bookItemId,
      BookItemStatusEnum.Rented,
    );
    return this.commandBus.execute(command);
  }
}
