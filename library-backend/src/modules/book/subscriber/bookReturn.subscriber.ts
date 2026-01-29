import { ChangeBookItemStatus } from "@book/commands/changeBookItemStatus/changeBookItemStatus.command";
import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { OnEvent } from "@nestjs/event-emitter";
import {
  BOOK_RENTAL_RETURNED,
  BookRentalReturnedEvent,
} from "@rental/domain/events/bookReturned.event";

@Injectable()
export class BookReturnSubscriber {
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent(BOOK_RENTAL_RETURNED)
  async afterBookRentalEvent(
    payload: BookRentalReturnedEvent["payload"],
  ): Promise<void> {
    const command = new ChangeBookItemStatus(
      payload.bookItemId,
      BookItemStatusEnum.Available,
    );
    return this.commandBus.execute(command);
  }
}
