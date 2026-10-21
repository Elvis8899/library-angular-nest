import { User } from "@modules/user/domain/user.entity";
import { z } from "zod";

export const USER_UPDATED = "user.updated";

export const UserUpdatedEvent = z.object({
  eventKey: z.literal(USER_UPDATED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type UserUpdatedEvent = z.infer<typeof UserUpdatedEvent>;

export const userUpdated = (
  user: Pick<User, "id" | "name">,
): UserUpdatedEvent => ({
  eventKey: USER_UPDATED,
  payload: { id: user.id, name: user.name },
});
