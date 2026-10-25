import { coverProblem } from "@app/pages/books/book.entity";
import { maxCoverBytes } from "@library/contracts";

describe("book.entity", () => {
  const file = (type: string, size = 3) =>
    new File([new Uint8Array(size)], "capa", { type });

  it("Should take a picked image the API takes, and say what it would refuse", () => {
    expect(coverProblem(file("image/png"))).toBeNull();
    expect(coverProblem(file("application/pdf"))).toBe("type");
    expect(coverProblem(file("image/jpeg", maxCoverBytes + 1))).toBe("size");
  });
});
