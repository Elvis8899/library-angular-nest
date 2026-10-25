import { errorCodes } from "@library/contracts";
import { readdirSync } from "node:fs";

// Every module's errors files, imported to read their classes' codes
const errorFiles = readdirSync("src/modules", {
  recursive: true,
  encoding: "utf8",
}).filter((path) => /^\w+\/domain\/\w+\.errors\.ts$/.test(path));

// An error class keeps its kind and code as statics (domainError)
const codeOf = (value: unknown): unknown =>
  typeof value === "function" && "kind" in value && "code" in value
    ? value.code
    : undefined;

describe("[Unit] The contracts' error codes", () => {
  it("Should all be an error class's code, or the unknown error's", async () => {
    const modules = await Promise.all(
      errorFiles.map(
        // Resolved when it runs, through the alias
        (path): Promise<object> =>
          import(/* @vite-ignore */ `@modules/${path.slice(0, -3)}`),
      ),
    );
    const used = modules
      .flatMap((exports) => Object.values(exports).map(codeOf))
      .filter((code) => typeof code === "string");
    expect(used.length).toBeGreaterThan(5);
    expect([...new Set([...used, "unknown"])].sort()).toEqual(
      [...errorCodes].sort(),
    );
  });
});
