import { BookInfoCreatedEvent } from "@book/domain/events/bookInfoCreated.event";
import { BookInfoDeletedEvent } from "@book/domain/events/bookInfoDeleted.event";
import { BookInfoUpdatedEvent } from "@book/domain/events/bookInfoUpdated.event";
import { BookItemCreatedEvent } from "@book/domain/events/bookItemCreated.event";
import { BookItemRemovedEvent } from "@book/domain/events/bookItemRemoved.event";
import { BookItemStatusChangeEvent } from "@book/domain/events/bookItemStatusChange.event";
import { FPF } from "@shared/functional/monads";

export const AllBookInfoEvents = FPF.tuple(
  BookInfoCreatedEvent,
  BookInfoUpdatedEvent,
  BookInfoDeletedEvent,
  BookItemCreatedEvent,
  BookItemRemovedEvent,
  BookItemStatusChangeEvent,
);
