import { HttpStatus } from "@nestjs/common";
import { useE2eApp } from "@test/util/e2eApp";

describe("AppController (e2e)", () => {
  const e2e = useE2eApp();

  it("/check (GET)", () => {
    return e2e.http().get("/check/status").expect(HttpStatus.OK).expect("ok");
  });
});
