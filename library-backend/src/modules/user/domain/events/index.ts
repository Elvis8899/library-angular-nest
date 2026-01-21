import { FPF } from "@src/shared/functional/monads";
import { UserCreatedEvent } from "./userCreated.event";
import { UserDeletedEvent } from "./userDeleted.event";
import { UserUpdatedEvent } from "./userUpdated.event";

export const AllUserEvents = FPF.tuple(
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
);
