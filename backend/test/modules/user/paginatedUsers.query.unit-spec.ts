import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  PaginatedUsersQuery,
  PaginatedUsersQueryHandler,
} from "@modules/user/queries/paginatedUsers/paginatedUsers.query";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

//Adapters

describe("[Unit] List Users", () => {
  const ctx = useHandlerModule(
    { providers: [PaginatedUsersQueryHandler] },
    (get) => ({
      userRepository: get(UserRepository),
      paginatedUsersQueryHandler: get(PaginatedUsersQueryHandler),
    }),
  );

  it("Should list users if query is valid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 0;
    const query = new PaginatedUsersQuery({
      limit,
      page,
    });

    //With users in database
    const user = new UserBuilder().build();
    await executeTask(ctx.userRepository.save(user));

    //When we list users
    const result = await ctx.paginatedUsersQueryHandler.execute(query);
    //Then it should show a list of users
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toStrictEqual(user);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Shouldnt list users if page is invalid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 1;
    const query = new PaginatedUsersQuery({
      limit,
      page,
    });

    //With users in database
    const user = new UserBuilder().build();
    await executeTask(ctx.userRepository.save(user));

    //When we list users
    const result = await ctx.paginatedUsersQueryHandler.execute(query);
    //Then it should show a list of users
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Should list the users of a page after the first", async () => {
    //Given a query for the second page
    const limit = 2;
    const page = 1;
    const query = new PaginatedUsersQuery({
      limit,
      page,
    });

    //With three users in database, created a day apart
    const users = [1, 2, 3].map((n) => ({
      ...new UserBuilder()
        .withId(createTestId(TableNameEnum.User, n))
        .withEmail(`user${String(n)}@email.com`)
        .withCPF("")
        .withRole(UserRoleEnum.Admin)
        .build(),
      createdAt: new Date(`2026-10-0${String(n)}T12:00:00Z`),
    }));
    for (const user of users) {
      await executeTask(ctx.userRepository.save(user));
    }

    //When we list users
    const result = await ctx.paginatedUsersQueryHandler.execute(query);
    //Then it should show only the oldest, as the newest come first
    expect(result.data).toStrictEqual([users[0]]);
    expect(result.count).toBe(3);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Shouldnt list users if there isnt users", async () => {
    //Given a valid query and no users in database
    const limit = 10;
    const page = 0;
    const query = new PaginatedUsersQuery({
      limit,
      page,
    });

    //When we list users
    const result = await ctx.paginatedUsersQueryHandler.execute(query);
    //Then it should show an empty list
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });
});
