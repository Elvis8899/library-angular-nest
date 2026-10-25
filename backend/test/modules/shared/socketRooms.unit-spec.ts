import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Resource } from "@shared/domainEventPublisher/resourceChanged.event";
import { roomsFor, roomsOf } from "@shared/socket/socketRooms";

describe("[Unit] Socket rooms", () => {
  it("Should put an admin in the admins' room, and a client in none", () => {
    expect(roomsOf({ role: UserRoleEnum.Admin })).toEqual(["admins"]);
    expect(roomsOf({ role: UserRoleEnum.Client })).toEqual([]);
  });

  it("Should send the accounts' changes to the admins", () => {
    expect(roomsFor({ resource: Resource.Users, key: "id" })).toEqual([
      "admins",
    ]);
  });

  it("Should send the other changes to everyone", () => {
    // Lending example: the only resources everyone reads
    expect(roomsFor({ resource: Resource.Books })).toBeNull();
  });
});
