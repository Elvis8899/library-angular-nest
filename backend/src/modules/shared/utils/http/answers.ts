import { contractList, contractRef, Sent } from "@library/contracts";
import { applyDecorators, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { z } from "zod";

type Status = HttpStatus.OK | HttpStatus.CREATED;

interface Options {
  // OK by default; a create answers CREATED
  status?: Status;
  description?: string;
}

/** A method decorator for routes that answer `T`. */
type Answering<T> = <M extends (...args: never[]) => Promise<T>>(
  target: object,
  property: string | symbol,
  descriptor: TypedPropertyDescriptor<M>,
) => void;

// The route answers with this status, documented with this schema, and the
// method must return what the schema sends
const answering =
  <T>(
    schema: object,
    { status = HttpStatus.OK, description }: Options,
  ): Answering<T> =>
  (target, property, descriptor) => {
    const documented = { schema, ...(description && { description }) };
    applyDecorators(
      HttpCode(status),
      status === HttpStatus.CREATED
        ? ApiCreatedResponse(documented)
        : ApiOkResponse(documented),
    )(target, property, descriptor);
  };

/**
 * What a route answers: the contract its Swagger response names, with the
 * route's status, and a method that doesn't return `Promise<Sent<typeof X>>`
 * doesn't compile. `@Answers(Grid, { status: HttpStatus.CREATED })`.
 */
export const Answers = <S extends z.ZodType>(
  schema: S,
  options: Options = {},
): Answering<Sent<S>> => answering(contractRef(schema), options);

/** A route answering a list of the contract: `@AnswersList(Worker)`. */
export const AnswersList = <S extends z.ZodType>(
  schema: S,
  options: Options = {},
): Answering<Sent<S>[]> => answering(contractList(schema), options);

/** A route answering one of the contracts, as the section's kind decides. */
export const AnswersOneOf = <S extends z.ZodType[]>(
  ...schemas: S
): Answering<Sent<S[number]>> =>
  answering({ oneOf: schemas.map(contractRef) }, {});
