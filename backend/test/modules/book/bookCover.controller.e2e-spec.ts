import { BookInfo, coverPath, maxCoverBytes } from "@library/contracts";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { HttpStatus } from "@nestjs/common";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { createBook } from "@test/modules/book/createBook";
import { useE2eApp } from "@test/util/e2eApp";
import { bodyOf } from "@test/util/responseBodies";

const authGuard = new MockAuthGuardBuilder();
const e2e = useE2eApp({ authGuard, resetEachTest: true });

const png = Buffer.from("\x89PNG\r\n\x1a\n cover", "latin1");
const book = new BookInfoBuilder();
const coverRoute = `/v1/bookInfos/${book.build().id}/cover`;

const upload = (body = png, name = "capa.png") =>
  e2e.http().put(coverRoute).attach("file", body, name);
const readBook = async () =>
  await bodyOf(BookInfo, e2e.http().get(`/v1/bookInfos/${book.build().id}`));

beforeEach(async () => {
  await createBook(e2e.prisma, book);
});

describe("[e2e] PUT, GET and DELETE /v1/bookInfos/{id}/cover", () => {
  it("Should store an uploaded cover, serve it at its version for a while, and take it off", async () => {
    const uploaded = await upload();
    const path = coverPath(await readBook());

    // Anyone who sees the books reads it
    authGuard.withRole(UserRoleEnum.Client);
    const served = await e2e
      .http()
      .get(path ?? "")
      .buffer(true);
    authGuard.reset();
    const removed = await e2e.http().delete(coverRoute);

    expect(uploaded.status).toBe(HttpStatus.OK);
    expect(served.status).toBe(HttpStatus.OK);
    expect(served.headers).toMatchObject({
      "content-type": "image/png",
      "cache-control": "private, max-age=31536000, immutable",
    });
    expect(Buffer.from(served.body)).toEqual(png);
    expect(removed.status).toBe(HttpStatus.OK);
    const [stored, response] = await Promise.all([
      readBook(),
      e2e.http().get(coverRoute),
    ]);
    expect(stored.cover).toBeNull();
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it.each([
    [
      "a file that isn't an image",
      () => upload(Buffer.from("%PDF-1.7"), "capa.png"),
      "book.coverType",
    ],
    [
      "one past the limit",
      () => upload(Buffer.alloc(maxCoverBytes + 1, png)),
      "book.coverTooLarge",
    ],
  ])("Should refuse %s with 422", async (_, send, code) => {
    const response = await send();

    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toMatchObject({ code });
    expect((await readBook()).cover).toBeNull();
  });

  it("Should refuse a request without a file with 422", async () => {
    const response = await e2e.http().put(coverRoute).send({});

    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should let only the admins change or remove a cover", async () => {
    authGuard.withRole(UserRoleEnum.Client);

    const [changed, removed] = [
      await upload(),
      await e2e.http().delete(coverRoute),
    ];

    expect([changed.status, removed.status]).toEqual([
      HttpStatus.FORBIDDEN,
      HttpStatus.FORBIDDEN,
    ]);
  });
});
