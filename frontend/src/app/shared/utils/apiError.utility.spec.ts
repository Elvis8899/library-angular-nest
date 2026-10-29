import {
  detailsOf,
  isChangedMeanwhile,
} from "@app/shared/utils/apiError.utility";

describe("isChangedMeanwhile", () => {
  it("Should tell the API's changed-meanwhile refusals", () => {
    expect(isChangedMeanwhile({ code: "book.coverChanged" })).toBe(true);
    expect(isChangedMeanwhile({ code: "rental.changed" })).toBe(true);
  });

  it("Should leave other errors out", () => {
    expect(isChangedMeanwhile({ code: "user.cpfTaken" })).toBe(false);
    expect(isChangedMeanwhile({ message: "falhou" })).toBe(false);
    expect(isChangedMeanwhile(null)).toBe(false);
  });
});

describe("detailsOf", () => {
  // No code sends details yet: the contracts' ErrorDetailsOf would type them
  const details = { userId: "u1" };

  it("Should give the details of an error with one of the codes", () => {
    const error = { code: "user.emailTaken", details };
    expect(detailsOf(error, "user.emailTaken")).toEqual(details);
    expect(
      detailsOf({ code: "user.cpfTaken" }, "user.emailTaken", "user.cpfTaken"),
    ).toBeNull();
  });

  it("Should give nothing for another code, or an error without one", () => {
    expect(
      detailsOf({ code: "user.cpfTaken", details }, "user.emailTaken"),
    ).toBeNull();
    expect(detailsOf({ message: "falhou" }, "user.emailTaken")).toBeNull();
    expect(detailsOf(null, "user.emailTaken")).toBeNull();
  });
});
