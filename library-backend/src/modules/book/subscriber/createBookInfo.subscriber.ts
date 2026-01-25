import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { OnEvent } from "@nestjs/event-emitter";
import {
  BOOK_INFO_CREATED,
  BookInfoCreatedEvent,
} from "../domain/events/bookInfoCreated.event";
import { AddBookItem } from "../commands/addBookItem/addBookItem.command";

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
