import { AddBookItem } from "@modules/book/commands/addBookItem/addBookItem.command";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "@modules/book/domain/events/bookInfoCreated.event";
import { Injectable } from "@nestjs/common";
import { OnDomainEvent } from "@shared/domainEventPublisher/onDomainEvent";
import { CommandBus } from "@shared/utils/application/cqrs";

// Policy: a new book starts with one copy on the shelf
@Injectable()
export class AddFirstBookItemSubscriber {
  constructor(private readonly commandBus: CommandBus) {}

  @OnDomainEvent(BOOK_INFO_CREATED)
  async addFirstBookItem(
    payload: BookInfoCreatedEvent["payload"],
  ): Promise<void> {
    const command = new AddBookItem({
      bookId: payload.id,
    });
    return this.commandBus.execute(command);
  }
}
