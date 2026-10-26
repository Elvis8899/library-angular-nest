import { UserRepository } from "@modules/user/database/user.repository.port";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
  UserNotFoundException,
} from "@modules/user/domain/user.errors";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { RepositoryKind, useRepositories } from "@test/util/repositoryContract";

/** What UserRepository promises, for the fake and the Prisma one. */
export const userRepositoryContract = (kind: RepositoryKind) =>
  describe(`[Contract] UserRepository (${kind})`, () => {
    const ctx = useRepositories(kind, (get) => ({
      users: get(UserRepository),
    }));
    const saveUser = (user: User) => executeTask(ctx.users.save(user));
    const at = new Date("2026-10-21T12:00:00Z");
    const withoutStamps = ({ createdAt: _, updatedAt: __, ...user }: User) =>
      user;
    const admin = (index: number) =>
      new UserBuilder(index)
        .withEmail(`admin${String(index)}@example.com`)
        .withRole(UserRoleEnum.Admin)
        .withCPF("")
        .build();

    it.each([
      ["an admin", new UserBuilder().withRole(UserRoleEnum.Admin).build()],
      ["a client", new UserBuilder().build()],
    ])("Should give %s back every way after saving", async (_, user) => {
      await saveUser(user);

      const [byId, byEmail, page, all] = await Promise.all([
        executeTask(ctx.users.findById(user.id)),
        executeTask(ctx.users.findByEmail(user.email)),
        executeTask(
          ctx.users.findAllPaginated({ page: 0, limit: 10, offset: 0 }),
        ),
        executeTask(ctx.users.findAll()),
      ]);

      expect(byId).toMatchObject(O.some(withoutStamps(user)));
      expect(byEmail).toMatchObject(O.some(withoutStamps(user)));
      expect([page.count, page.data.length, all.length]).toEqual([1, 1, 1]);
    });

    it("Should find the users with the given ids, leaving out missing ones", async () => {
      await saveUser(admin(1));
      await saveUser(admin(2));

      const found = await executeTask(
        ctx.users.findByIds([
          admin(2).id,
          createTestId(TableNameEnum.User, 99),
        ]),
      );

      expect(found.map(({ id }) => id)).toEqual([admin(2).id]);
    });

    it("Should find a client by CPF, with or without the mask", async () => {
      const client = new UserBuilder().withCPF("52998224725").build();
      await saveUser(client);

      const [masked, bare, other] = await Promise.all([
        executeTask(ctx.users.findByCPF("529.982.247-25")),
        executeTask(ctx.users.findByCPF("52998224725")),
        executeTask(ctx.users.findByCPF("11144477735")),
      ]);

      expect(O.map((found: User) => found.id)(masked)).toEqual(
        O.some(client.id),
      );
      expect(O.map((found: User) => found.id)(bare)).toEqual(O.some(client.id));
      expect(other).toEqual(O.none);
    });

    it("Should list the newest users first", async () => {
      const older = {
        ...admin(1),
        createdAt: new Date("2026-10-01T12:00:00Z"),
      };
      const newer = {
        ...admin(2),
        createdAt: new Date("2026-10-02T12:00:00Z"),
      };
      await saveUser(older);
      await saveUser(newer);

      const page = await executeTask(
        ctx.users.findAllPaginated({ page: 0, limit: 10, offset: 0 }),
      );
      const all = await executeTask(ctx.users.findAll());

      expect(page.data.map(({ id }) => id)).toEqual([newer.id, older.id]);
      expect(all.map(({ id }) => id)).toEqual([newer.id, older.id]);
    });

    // The commands check uniqueness first; these are writes that raced past it
    it("Should refuse with 409 user.emailTaken another user's email, whatever the case", async () => {
      await saveUser(new UserBuilder(0).withEmail("ana@example.com").build());

      await expect(
        saveUser(
          new UserBuilder(1)
            .withCPF("11144477735")
            .withEmail("Ana@Example.com")
            .build(),
        ),
      ).rejects.toBeInstanceOf(UserEmailAlreadyExistsException);
    });

    it("Should refuse with 409 user.cpfTaken another user's CPF", async () => {
      await saveUser(new UserBuilder(0).build());

      await expect(
        saveUser(new UserBuilder(1).withEmail("other@example.com").build()),
      ).rejects.toBeInstanceOf(UserCPFAlreadyExistsException);
    });

    it("Should let several admins have no CPF, read back as empty", async () => {
      await saveUser(admin(0));
      await saveUser(admin(1));

      expect(
        (await executeTask(ctx.users.findAll())).map(({ cpf }) => cpf),
      ).toEqual(["", ""]);
    });

    it("Should store emails in lowercase and find them whatever the case", async () => {
      const user = new UserBuilder(0).withEmail("Ana@Example.com").build();
      await saveUser(user);

      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({ email: "ana@example.com" }),
      );
      expect(
        O.map((found: User) => found.id)(
          await executeTask(ctx.users.findByEmail("ANA@example.COM")),
        ),
      ).toEqual(O.some(user.id));
    });

    it("Should delete a user, and refuse with 404 one that isn't there", async () => {
      const user = new UserBuilder().build();
      await saveUser(user);

      await executeTask(ctx.users.deleteById(user.id));
      await expect(
        executeTask(ctx.users.deleteById(user.id)),
      ).rejects.toBeInstanceOf(UserNotFoundException);

      expect(await executeTask(ctx.users.findAll())).toEqual([]);
    });

    it("Should find nothing when there is no user", async () => {
      const [byId, byCPF, page, all] = await Promise.all([
        executeTask(ctx.users.findById(createTestId(TableNameEnum.None, 0))),
        executeTask(ctx.users.findByCPF("52998224725")),
        executeTask(
          ctx.users.findAllPaginated({ page: 0, limit: 10, offset: 0 }),
        ),
        executeTask(ctx.users.findAll()),
      ]);

      expect([byId, byCPF]).toEqual([O.none, O.none]);
      expect([page.count, page.data.length, all.length]).toEqual([0, 0, 0]);
    });

    it("Should revoke the tokens by a new version, which a later save keeps", async () => {
      const user = new UserBuilder().build();
      await saveUser(user);

      await executeTask(ctx.users.revokeTokens({ userId: user.id, at }));
      // A save of what was read before the revocation
      await saveUser({ ...user, name: "Renamed" });

      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({ name: "Renamed", tokenVersion: user.tokenVersion + 1 }),
      );
    });

    it("Should deactivate an account, revoking its tokens, which a later save keeps", async () => {
      const user = new UserBuilder().build();
      await saveUser(user);

      await executeTask(ctx.users.deactivate({ userId: user.id, at }));
      // A save of what was read before the deactivation
      await saveUser({ ...user, name: "Renamed" });

      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({
          name: "Renamed",
          active: false,
          tokenVersion: user.tokenVersion + 1,
        }),
      );
    });

    it("Should reactivate an account, which a later save keeps", async () => {
      const user = new UserBuilder().build();
      await saveUser(user);
      await executeTask(ctx.users.deactivate({ userId: user.id, at }));

      await executeTask(ctx.users.reactivate({ userId: user.id, at }));
      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({ active: true, updatedAt: at }),
      );
      await saveUser({ ...user, active: false });

      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({ active: true }),
      );
    });

    it("Should leave a new account's state as given", async () => {
      const user = { ...new UserBuilder().build(), active: false };

      await saveUser(user);

      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({ active: false }),
      );
    });

    it("Should record the last access, which a later save keeps", async () => {
      const user = new UserBuilder().build();
      await saveUser(user);

      await executeTask(ctx.users.recordAccess({ id: user.id, at }));
      // A save of what was read before the access
      await saveUser({ ...user, name: "Renamed" });

      expect(user.lastAccessAt).toBeNull();
      expect(await executeTask(ctx.users.findById(user.id))).toMatchObject(
        O.some({ name: "Renamed", lastAccessAt: at }),
      );
    });

    it("Should ignore an access recorded for an unknown user", async () => {
      await expect(
        executeTask(
          ctx.users.recordAccess({
            id: createTestId(TableNameEnum.User, 9),
            at: new Date("2026-10-21T12:00:00Z"),
          }),
        ),
      ).resolves.toBeUndefined();
    });

    it("Should ignore a revocation or a change of state for an unknown user", async () => {
      const userId = createTestId(TableNameEnum.User, 9);

      for (const write of [
        ctx.users.revokeTokens,
        ctx.users.deactivate,
        ctx.users.reactivate,
      ])
        await expect(
          executeTask(write({ userId, at })),
        ).resolves.toBeUndefined();
    });
  });
