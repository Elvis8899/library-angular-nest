import { S3Client } from "@aws-sdk/client-s3";
import { FakeFileStorage } from "@shared/storage/fakeFileStorage";
import { FileType, fileTypeOf } from "@shared/storage/fileType";
import { S3Bucket, S3FileStorage } from "@shared/storage/s3FileStorage";
import { removeUnsavedRTE, removeUnusedRTE } from "@shared/storage/storedFiles";
import { executeTask } from "@shared/utils/application/executeTask";
import { E, FPF, O, TE } from "@shared/utils/application/monads";
import { PinoLogger } from "nestjs-pino";

describe("[Unit] File types", () => {
  it.each([
    [FileType.Jpeg, "\xff\xd8\xff\xdb"],
    [FileType.Png, "\x89PNG\r\n\x1a\n\0"],
    [FileType.Gif, "GIF87a"],
    [FileType.Gif, "GIF89a"],
    [FileType.Webp, "RIFF\0\0\0\0WEBPVP8 "],
    [FileType.Pdf, "%PDF-1.7"],
  ])("Should tell a %s by its first bytes", (type, bytes) => {
    expect(fileTypeOf(Buffer.from(bytes, "latin1"))).toEqual(O.some(type));
  });

  it("Should tell nothing of other files, whatever their name says", () => {
    expect(fileTypeOf(Buffer.from("PK\x03\x04"))).toEqual(O.none);
    // RIFF without WEBP: a WAV
    expect(fileTypeOf(Buffer.from("RIFF\0\0\0\0WAVE"))).toEqual(O.none);
    expect(fileTypeOf(Buffer.alloc(0))).toEqual(O.none);
  });
});

describe("[Unit] FakeFileStorage", () => {
  it("Should keep, give and remove files by key", async () => {
    const storage = new FakeFileStorage();
    await executeTask(storage.put("a/b", Buffer.from("x"), FileType.Pdf));
    expect(await executeTask(storage.get("a/b"))).toEqual(
      O.some({ body: Buffer.from("x"), contentType: FileType.Pdf }),
    );
    await executeTask(storage.remove("a/b"));
    expect(await executeTask(storage.get("a/b"))).toEqual(O.none);
  });
});

describe("[Unit] S3FileStorage", () => {
  // What the server answers is the integration spec's; these are the
  // answers it never gives
  const storageAnswering = (answer: object) => {
    const client = new S3Client({ region: "us-east-1" });
    // send's types join its callback form, which answers nothing
    const send: typeof client.send = FPF.unsafeCoerce(() =>
      Promise.resolve(answer),
    );
    client.send = send;
    return new S3FileStorage(new S3Bucket(client, "bucket"));
  };

  it("Should take an answer without a body as no file", async () => {
    expect(await executeTask(storageAnswering({}).get("a"))).toEqual(O.none);
  });

  it("Should take a file without a type as plain bytes", async () => {
    const storage = storageAnswering({
      Body: {
        transformToByteArray: () => Promise.resolve(new Uint8Array([1])),
      },
    });
    expect(await executeTask(storage.get("a"))).toEqual(
      O.some({
        body: Buffer.from([1]),
        contentType: "application/octet-stream",
      }),
    );
  });
});

describe("[Unit] Stored files", () => {
  const logger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const env = { logger: FPF.unsafeCoerce<typeof logger, PinoLogger>(logger) };
  const failing = new FakeFileStorage();
  failing.remove = () => TE.left(new Error("storage down"));

  it("Should keep the write's error whether or not the unsaved file goes", async () => {
    const storage = new FakeFileStorage();
    await executeTask(storage.put("a", Buffer.from("x"), FileType.Png));
    const error = new Error("write refused");

    expect(await removeUnsavedRTE(storage, "a")(error)(env)()).toEqual(
      E.left(error),
    );
    expect(storage.files.size).toBe(0);
    expect(await removeUnsavedRTE(failing, "a")(error)(env)()).toEqual(
      E.left(error),
    );
  });

  it("Should remove an unused file, only logging a failure, and nothing for no key", async () => {
    expect(await removeUnusedRTE(failing, "a")(env)()).toEqual(
      E.right(undefined),
    );
    expect(await removeUnusedRTE(failing, null)(env)()).toEqual(
      E.right(undefined),
    );
  });
});
