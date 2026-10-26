import fastifyMultipart from "@fastify/multipart";
import { UnprocessableEntityException } from "@nestjs/common";
import { readUpload } from "@shared/utils/http/upload";
import Fastify, { FastifyInstance } from "fastify";

const boundary = "----spec";

/** A multipart body: text fields first, then the file. */
const multipart = (fields: Record<string, string>, file?: string) =>
  [
    ...Object.entries(fields).map(
      ([name, value]) =>
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
    ),
    ...(file === undefined
      ? []
      : [
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="capa.png"\r\nContent-Type: image/png\r\n\r\n${file}\r\n`,
        ]),
    `--${boundary}--\r\n`,
  ].join("");

describe("[Unit] readUpload", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(fastifyMultipart);
    app.post("/upload", async (request, reply) => {
      try {
        const upload = await readUpload(request, 8);
        return { ...upload, body: upload.body.toString() };
      } catch (error) {
        const refused = error instanceof UnprocessableEntityException;
        return reply.code(refused ? 422 : 500).send();
      }
    });
    await app.ready();
  });

  afterAll(() => app.close());

  const send = (payload: string, contentType = "multipart/form-data") =>
    app.inject({
      method: "POST",
      url: "/upload",
      headers: { "content-type": `${contentType}; boundary=${boundary}` },
      payload,
    });

  it("Should read the file and the text fields sent before it", async () => {
    const response = await send(
      multipart({ title: "Dom Casmurro", copy: "2" }, "abc"),
    );

    expect(response.json()).toEqual({
      fields: { title: "Dom Casmurro", copy: "2" },
      name: "capa.png",
      body: "abc",
      truncated: false,
    });
  });

  it("Should keep only the start of a file past the limit", async () => {
    const response = await send(multipart({}, "0123456789"));

    expect(response.json()).toMatchObject({
      body: "01234567",
      truncated: true,
    });
  });

  it("Should refuse a request without a file, or not multipart, with 422", async () => {
    expect((await send(multipart({ title: "x" }))).statusCode).toBe(422);
    expect((await send("{}", "application/json")).statusCode).toBe(422);
  });
});
