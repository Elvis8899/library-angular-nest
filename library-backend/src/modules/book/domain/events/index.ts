import { FPF } from "@src/shared/functional/monads";
import { BookInfoCreatedEvent } from "./bookInfoCreated.event";
import { BookInfoDeletedEvent } from "./bookInfoDeleted.event";
import { BookInfoUpdatedEvent } from "./bookInfoUpdated.event";

export const AllBookInfoEvents = FPF.tuple(
  BookInfoCreatedEvent,
  BookInfoUpdatedEvent,
  BookInfoDeletedEvent,
);
