import { DateType } from "@shared/utils/domain/DateType";

describe("[Unit] Date Type", () => {
  it("Should parse string dates", () => {
    // With a valid date input
    const date = "2022-01-01T00:00:00.000Z";

    const res = DateType.safeParse(date);

    // It Should successfully parse
    expect(res.success).toBe(true);
    expect(res.data).toBeInstanceOf(Date);
  });

  it("Should parse number dates", () => {
    // With a valid date input
    const date = 1577836800000;

    const res = DateType.safeParse(date);

    // It Should successfully parse
    expect(res.success).toBe(true);
    expect(res.data).toBeInstanceOf(Date);
  });

  it("Should parse Date dates", () => {
    // With a valid date input
    const date = new Date();

    const res = DateType.safeParse(date);

    // It Should successfully parse
    expect(res.success).toBe(true);
    expect(res.data).toBeInstanceOf(Date);
  });

  it("Should parse null", () => {
    // With a valid date input
    const date = null;

    const res = DateType.safeParse(date);

    // It Should successfully parse
    expect(res.success).toBe(true);
    expect(res.data).toBeInstanceOf(Date);
  });

  it("Should return error on invalid Date", () => {
    // With an invalid date input
    const date = "asdasd";

    const res = DateType.safeParse(date);

    // It Should return an error
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toBe(
      "Invalid input: expected date, received Date",
    );
  });

  it("Should return error on invalid Date", () => {
    // With an invalid date input type
    const date = {};

    const res = DateType.safeParse(date);

    // It Should return an error
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toBe("Invalid input");
  });
  it("Should return error on invalid Date", () => {
    // With an invalid date input type

    const res = DateType.safeParse([]);

    // It Should return an error
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toBe("Invalid input");
  });
});
