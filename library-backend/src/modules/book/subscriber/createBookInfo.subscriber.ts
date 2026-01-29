import { AddBookItem } from "@book/commands/addBookItem/addBookItem.command";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "@book/domain/events/bookInfoCreated.event";
import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class CreateBookInfoSubscriber {
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent(BOOK_INFO_CREATED)
  async afterBookInfoCreatedEvent(
    payload: BookInfoCreatedEvent["payload"],
  ): Promise<void> {
    const command = new AddBookItem({
      bookId: payload.id,
    });
    return this.commandBus.execute(command);
  }
}
