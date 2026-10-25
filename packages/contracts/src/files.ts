// The files the API stores, without Zod (the frontend's bundle takes them
// as they are)

/** The types the API tells from a file's first bytes. */
export const FileType = {
  Jpeg: "image/jpeg",
  Png: "image/png",
  Webp: "image/webp",
  Gif: "image/gif",
  Pdf: "application/pdf",
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];
