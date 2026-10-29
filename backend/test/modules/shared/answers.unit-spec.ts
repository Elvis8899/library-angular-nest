import { AuditEntry, AuthResponse } from "@library/contracts";
import { HttpStatus } from "@nestjs/common";
import { HTTP_CODE_METADATA } from "@nestjs/common/constants";
import { FPF } from "@shared/utils/application/monads";
import { Answers, AnswersList, AnswersOneOf } from "@shared/utils/http/answers";
import { z } from "zod";

// What each decorator leaves on its route: the status, and the response
// Swagger documents for it
class Routes {
  @Answers(AuthResponse, { status: HttpStatus.CREATED, description: "Ok" })
  one() {
    return Promise.resolve(FPF.unsafeCoerce<unknown, AuthResponse>({}));
  }

  @AnswersList(AuditEntry)
  list() {
    return Promise.resolve([]);
  }

  @AnswersOneOf(AuthResponse, AuditEntry)
  either() {
    return Promise.resolve(FPF.unsafeCoerce<unknown, AuthResponse>({}));
  }
}

// What Swagger keeps for a route's responses, by status
const Responses = z.record(
  z.string(),
  z.object({
    description: z.string().optional(),
    schema: z.record(z.string(), z.unknown()),
  }),
);

const metadataOf = (route: keyof Routes) => {
  const method = FPF.unsafeCoerce<unknown, object>(
    Object.getOwnPropertyDescriptor(Routes.prototype, route)?.value,
  );
  return {
    status: z.number().parse(Reflect.getMetadata(HTTP_CODE_METADATA, method)),
    responses: Responses.parse(
      Reflect.getMetadata("swagger/apiResponse", method),
    ),
  };
};

describe("[Unit] Answers", () => {
  it("Should set the status and document one contract", () => {
    const { status, responses } = metadataOf("one");

    expect(status).toBe(HttpStatus.CREATED);
    expect(responses[HttpStatus.CREATED]?.description).toBe("Ok");
    expect(String(responses[HttpStatus.CREATED]?.schema["$ref"])).toContain(
      "AuthResponse",
    );
  });

  it("Should document a list of the contract, answered with OK", () => {
    const { status, responses } = metadataOf("list");

    expect(status).toBe(HttpStatus.OK);
    expect(responses[HttpStatus.OK]?.schema).toMatchObject({ type: "array" });
  });

  it("Should document one of several contracts", () => {
    const { responses } = metadataOf("either");

    expect(responses[HttpStatus.OK]?.schema["oneOf"]).toHaveLength(2);
  });
});
