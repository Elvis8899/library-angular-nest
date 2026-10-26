import { User } from "@modules/user/domain/user.entity";
import { z } from "zod";

export const USER_DEACTIVATED = "user.deactivated";

export const UserDeactivatedEvent = z.object({
  eventKey: z.literal(USER_DEACTIVATED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type UserDeactivatedEvent = z.infer<typeof UserDeactivatedEvent>;

export const userDeactivated = (
  user: Pick<User, "id" | "name">,
): UserDeactivatedEvent => ({
  eventKey: USER_DEACTIVATED,
  payload: { id: user.id, name: user.name },
});
