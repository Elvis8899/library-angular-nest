import { FileType } from "@library/contracts";
import { O } from "@shared/utils/application/monads";

export { FileType } from "@library/contracts";

export const fileExtensions: Record<FileType, string> = {
  [FileType.Jpeg]: "jpg",
  [FileType.Png]: "png",
  [FileType.Webp]: "webp",
  [FileType.Gif]: "gif",
  [FileType.Pdf]: "pdf",
};

const startsWith = (body: Buffer, bytes: readonly number[], at = 0) =>
  body.subarray(at, at + bytes.length).equals(Buffer.from(bytes));

const startsWithText = (body: Buffer, text: string, at = 0) =>
  body.toString("latin1", at, at + text.length) === text;

const signatures: [FileType, (body: Buffer) => boolean][] = [
  [FileType.Jpeg, (body) => startsWith(body, [0xff, 0xd8, 0xff])],
  [
    FileType.Png,
    (body) =>
      startsWith(body, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ],
  [
    FileType.Gif,
    (body) => startsWithText(body, "GIF87a") || startsWithText(body, "GIF89a"),
  ],
  [
    FileType.Webp,
    (body) => startsWithText(body, "RIFF") && startsWithText(body, "WEBP", 8),
  ],
  [FileType.Pdf, (body) => startsWithText(body, "%PDF-")],
];

/**
 * The file's type from its first bytes, never from the name or the type
 * the browser sent; none when it isn't one the API stores.
 */
export const fileTypeOf = (body: Buffer): O.Option<FileType> =>
  O.fromNullable(signatures.find(([, matches]) => matches(body))?.[0]);

const maxNameLength = 120;

/**
 * The name a file is shown and downloaded with: without a path or control
 * characters, at most 120 characters, and "arquivo.<ext>" when nothing is
 * left.
 */
export const cleanFileName = (name: string, type: FileType): string =>
  name
    .replace(/^.*[\\/]/, "")
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, maxNameLength) || `arquivo.${fileExtensions[type]}`;
