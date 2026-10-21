import { BookInfoCreatedEvent } from "@modules/book/domain/events/bookInfoCreated.event";
import { BookInfoDeletedEvent } from "@modules/book/domain/events/bookInfoDeleted.event";
import { BookInfoUpdatedEvent } from "@modules/book/domain/events/bookInfoUpdated.event";
import { BookItemCreatedEvent } from "@modules/book/domain/events/bookItemCreated.event";
import { BookItemRemovedEvent } from "@modules/book/domain/events/bookItemRemoved.event";
import { FPF } from "@shared/utils/application/monads";

export const AllBookInfoEvents = FPF.tuple(
  BookInfoCreatedEvent,
  BookInfoUpdatedEvent,
  BookInfoDeletedEvent,
  BookItemCreatedEvent,
  BookItemRemovedEvent,
);
