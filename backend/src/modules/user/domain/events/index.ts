import { UserCreatedEvent } from "@modules/user/domain/events/userCreated.event";
import { UserDeactivatedEvent } from "@modules/user/domain/events/userDeactivated.event";
import { UserDeletedEvent } from "@modules/user/domain/events/userDeleted.event";
import { UserReactivatedEvent } from "@modules/user/domain/events/userReactivated.event";
import { UserUpdatedEvent } from "@modules/user/domain/events/userUpdated.event";
import { FPF } from "@shared/utils/application/monads";

export const AllUserEvents = FPF.tuple(
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  UserDeactivatedEvent,
  UserReactivatedEvent,
);
