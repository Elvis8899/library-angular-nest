// What the API's socket tells the screens, without Zod: that something they
// show changed, so they reload it through its REST route. It carries no
// data: the route's guards decide what each client may read

/** Where the API's Socket.IO server listens, on the API's own host. */
export const LIVE_UPDATES_PATH = "/v1/socket.io";

/** The one event the socket sends. */
export const RESOURCE_CHANGED = "resource.changed";

/** What a screen shows and reloads when it changes. */
export const Resource = {
  // Admins' (key: the user)
  Users: "users",
  // Lending example: the books and their copies (key: the book)
  Books: "books",
  // Lending example: the rentals
  Rentals: "rentals",
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];

/** A change: sent to the admins alone for their resources, to everyone
 * otherwise. */
export type ResourceChange = {
  resource: Resource;
  // What changed within it, such as an id
  key?: string;
};

/** The events the socket sends, for Socket.IO's typed servers and clients. */
export type LiveUpdateEvents = {
  [RESOURCE_CHANGED]: (change: ResourceChange) => void;
};
