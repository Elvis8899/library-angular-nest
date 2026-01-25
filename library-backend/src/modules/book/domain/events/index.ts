import { FPF } from "@src/shared/functional/monads";
import { BookInfoCreatedEvent } from "./bookInfoCreated.event";
import { BookInfoDeletedEvent } from "./bookInfoDeleted.event";
import { BookInfoUpdatedEvent } from "./bookInfoUpdated.event";
import { BookItemCreatedEvent } from "./bookItemCreated.event";
import { BookItemRemovedEvent } from "./bookItemRemoved.event";
import { BookItemStatusChangeEvent } from "./bookItemStatusChange.event";

export const AllBookInfoEvents = FPF.tuple(
  BookInfoCreatedEvent,
  BookInfoUpdatedEvent,
  BookInfoDeletedEvent,
  BookItemCreatedEvent,
  BookItemRemovedEvent,
  BookItemStatusChangeEvent,
);
