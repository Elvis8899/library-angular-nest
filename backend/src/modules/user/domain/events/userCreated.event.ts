import { User } from "@modules/user/domain/user.entity";
import { z } from "zod";

export const USER_CREATED = "user.created";

export const UserCreatedEvent = z.object({
  eventKey: z.literal(USER_CREATED),
  payload: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type UserCreatedEvent = z.infer<typeof UserCreatedEvent>;

export const userCreated = (
  user: Pick<User, "id" | "name">,
): UserCreatedEvent => ({
  eventKey: USER_CREATED,
  payload: { id: user.id, name: user.name },
});
