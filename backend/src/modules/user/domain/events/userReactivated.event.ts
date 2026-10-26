import { User } from "@modules/user/domain/user.entity";
import { z } from "zod";

export const USER_REACTIVATED = "user.reactivated";

export const UserReactivatedEvent = z.object({
  eventKey: z.literal(USER_REACTIVATED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type UserReactivatedEvent = z.infer<typeof UserReactivatedEvent>;

export const userReactivated = (
  user: Pick<User, "id" | "name">,
): UserReactivatedEvent => ({
  eventKey: USER_REACTIVATED,
  payload: { id: user.id, name: user.name },
});
