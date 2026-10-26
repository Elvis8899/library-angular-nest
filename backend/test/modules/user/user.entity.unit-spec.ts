import {
  changeUserDetails,
  deactivateUser,
  endsSessions,
  NewUserInput,
  reactivateUser,
  registerUser,
  UserChangesInput,
  UserRoleEnum,
} from "@modules/user/domain/user.entity";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { UserDeactivatesSelfException } from "@modules/user/domain/user.errors";
import { E, O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";

const passwordHasher = new BcryptPasswordHasher();

describe("[Unit] User entity", () => {
  const user = new UserBuilder(1).build();
  const details = {
    name: "Novo Nome",
    email: "Novo@Example.com",
    cpf: "11144477735",
    role: UserRoleEnum.Client,
  };
  const now = new Date("2026-10-21T12:00:00Z");

  describe("NewUserInput", () => {
    it("Should normalize the email and format the document", () => {
      expect(
        NewUserInput.parse({ ...details, password: "1234" }),
      ).toMatchObject({ email: "novo@example.com", cpf: "111.444.777-35" });
    });

    it.each([
      { invalid: "a short password", input: { password: "123" } },
      { invalid: "wrong check digits", input: { cpf: "12345678901" } },
      { invalid: "a client without a document", input: { cpf: "" } },
    ])("Should refuse $invalid", ({ input }) => {
      expect(
        NewUserInput.safeParse({ ...details, password: "1234", ...input })
          .success,
      ).toBe(false);
    });

    it("Should let an admin leave the document empty", () => {
      expect(
        NewUserInput.parse({
          ...details,
          role: UserRoleEnum.Admin,
          cpf: null,
          password: "1234",
        }).cpf,
      ).toBe("");
    });
  });

  describe("UserChangesInput", () => {
    it("Should make the password optional, but checked when given", () => {
      expect(UserChangesInput.parse(details).password).toBeUndefined();
      expect(
        UserChangesInput.safeParse({ ...details, password: "123" }).success,
      ).toBe(false);
    });
  });

  it("Should register a user with no sessions revoked yet", async () => {
    const password = await passwordHasher.hash("1234");
    const input = NewUserInput.parse({ ...details, password: "1234" });

    expect(registerUser(user.id, input, password, now)).toEqual({
      id: user.id,
      name: "Novo Nome",
      email: "novo@example.com",
      cpf: "111.444.777-35",
      role: UserRoleEnum.Client,
      active: true,
      password,
      tokenVersion: 0,
      lastAccessAt: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  describe("changeUserDetails", () => {
    const stored = { ...user, tokenVersion: 3 };
    const changes = UserChangesInput.parse(details);

    it("Should keep the id, token version, creation date and password", () => {
      const changed = changeUserDetails(changes, O.none, now)(stored);

      expect(changed).toEqual({
        ...stored,
        name: "Novo Nome",
        email: "novo@example.com",
        cpf: "111.444.777-35",
        updatedAt: now,
      });
    });

    it("Should replace the password when a new one is given", async () => {
      const password = await passwordHasher.hash("nova-senha");

      expect(
        changeUserDetails(changes, O.some(password), now)(stored).password,
      ).toBe(password);
    });
  });

  describe("deactivateUser and reactivateUser", () => {
    const admin = new UserBuilder(2).build();

    it("Should deactivate another account, and reactivate it", () => {
      const deactivated = deactivateUser(admin.id, now)(user);

      expect(deactivated).toEqual(
        E.right({ ...user, active: false, updatedAt: now }),
      );
      expect(reactivateUser(now)({ ...user, active: false })).toEqual({
        ...user,
        active: true,
        updatedAt: now,
      });
    });

    it("Should not let an admin deactivate their own account", () => {
      expect(deactivateUser(user.id, now)(user)).toEqual(
        E.left(new UserDeactivatesSelfException()),
      );
    });
  });

  describe("endsSessions", () => {
    const changed = () => new UserBuilder(1);

    it.each([
      { change: "the password", after: () => changed().withPassword("outro") },
      {
        change: "the email",
        after: () => changed().withEmail("o@example.com"),
      },
      {
        change: "the role",
        after: () => changed().withRole(UserRoleEnum.Admin),
      },
    ])("Should end them when $change changes", ({ after }) => {
      expect(endsSessions(user, after().build())).toBe(true);
    });

    it("Should keep them when only the name or document changes", () => {
      const after = changed().withName("Outro").withCPF("11144477735").build();

      expect(endsSessions(user, after)).toBe(false);
    });
  });
});
