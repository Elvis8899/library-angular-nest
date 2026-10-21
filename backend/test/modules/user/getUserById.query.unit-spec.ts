import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserNotFoundException } from "@modules/user/domain/user.errors";
import {
  GetUserByIdQuery,
  GetUserByIdQueryHandler,
} from "@modules/user/queries/getUserById/getUserById.query";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] List Users", () => {
  const ctx = useHandlerModule(
    { providers: [GetUserByIdQueryHandler] },
    (get) => ({
      userRepository: get(UserRepository),
      getUserByIdQueryHandler: get(GetUserByIdQueryHandler),
    }),
  );

  it("Should get user if he exists", async () => {
    //Given a valid query
    const user = new UserBuilder().build();

    const query = new GetUserByIdQuery(user.id);

    //With users in database
    await executeTask(ctx.userRepository.save(user));

    //When we get user id
    const result = await ctx.getUserByIdQueryHandler.execute(query);
    //Then it should show his data
    expect(result.id).toBe(user.id);
  });

  it("Shouldnt get user if id is invalid", async () => {
    //Given a valid query
    const query = new GetUserByIdQuery("00000000-0000-0000-0001-000000000000");

    //With users in database
    const user = new UserBuilder(1).build();
    await executeTask(ctx.userRepository.save(user));

    //When get user
    const resultPromise = ctx.getUserByIdQueryHandler.execute(query);
    //Then it should show a list of users

    await expect(resultPromise).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("Shouldnt get user if there isnt users", async () => {
    //Given a valid query and no users in database

    const user = new UserBuilder(1).build();
    const query = new GetUserByIdQuery(user.id);

    //When we list users
    const resultPromise = ctx.getUserByIdQueryHandler.execute(query);
    //Then it should throw an UserNotFoundException
    await expect(resultPromise).rejects.toBeInstanceOf(UserNotFoundException);
  });
});
