import { getBaseEnvPath } from "@src/shared/utils/dotenv";

describe("[Unit] Environment", () => {
  it("Should return base env path for test", async () => {
    //
    const res = getBaseEnvPath("test");

    expect(res).toBe("../../../.env.test");
  });
  it("Should return default base env path", async () => {
    //
    const res = getBaseEnvPath(undefined);

    expect(res).toBe("../../../../.env");
  });
});
