import { UserCreatedEvent } from "@modules/user/domain/events/userCreated.event";
import { UserDeletedEvent } from "@modules/user/domain/events/userDeleted.event";
import { UserUpdatedEvent } from "@modules/user/domain/events/userUpdated.event";
import { FPF } from "@shared/utils/application/monads";

export const AllUserEvents = FPF.tuple(
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
);
