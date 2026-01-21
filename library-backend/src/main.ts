import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "@src/app.module";
import { Logger } from "nestjs-pino";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastifyRequestContext from "@fastify/request-context";
import helmet from "@fastify/helmet";
import { contentParser } from "fastify-file-interceptor";
// import * as multipart from "@fastify/multipart";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({}),
    { bufferLogs: true },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  const options = new DocumentBuilder()
    .setTitle("Biblioteca")
    .setVersion("0.1")
    //     .setDescription(
    //       `### REST
    // Routes is following REST standard (Richardson level 3)

    // <details><summary>Detailed specification</summary>
    // <p>

    // **List:**
    // - \`GET /<resources>/\`
    //   - Get the list of **<resources>** as admin
    // - \`GET /user/<user_id>/<resources>/\`
    //   - Get the list of **<resources>** for a given **<user_id>**
    //   - Output a **403** if logged user is not **<user_id>**

    // **Detail:**
    // - \`GET /<resources>/<resource_id>\`
    //   - Get the detail for **<resources>** of id **<resource_id>**
    //   - Output a **404** if not found
    // - \`GET /user/<user_id>/<resources>/<resource_id>\`
    //   - Get the list of **<resources>** for a given **user_id**
    //   - Output a **404** if not found
    //   - Output a **403** if:
    //     - Logged user is not **<user_id>**
    //     - The **<user_id>** have no access to **<resource_id>**

    // **Creation / Edition / Replacement / Suppression:**
    // - \`<METHOD>\` is:
    //   - **POST** for creation
    //   - **PATCH** for update (one or more fields)
    //   - **PUT** for replacement (all fields, not used)
    //   - **DELETE** for suppression (all fields, not used)
    // - \`<METHOD> /<resources>/<resource_id>\`
    //   - Create **<resources>** with id **<resource_id>** as admin
    //   - Output a **400** if **<resource_id>** conflicts with existing **<resources>**
    // - \`<METHOD> /user/<user_id>/<resources>/<resource_id>\`
    //   - Create **<resources>** with id **<resource_id>** as a given **user_id**
    //   - Output a **409** if **<resource_id>** conflicts with existing **<resources>**
    //   - Output a **403** if:
    //     - Logged user is not **<user_id>**
    //     - The **<user_id>** have no access to **<resource_id>**
    // </p>
    // </details>`,
    //     )
    .addSecurity("bearer", {
      type: "http",
      scheme: "bearer",
    })
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("swagger", app, document);

  app.register(fastifyRequestContext);

  await app.register(contentParser);
  // await app.register(multipart, {
  //   limits: {
  //     fileSize: 1024 * 1024 * 10, // 10mb- max file size
  //     fieldNameSize: 100, // 100 bytes- max field name size
  //     fields: 10, // 10 files- max number of fields
  //     fieldSize: 100, // 100 bytes- max field value size
  //     files: 5, // 5 files- max number of files
  //   },
  //   attachFieldsToBody: true,
  // });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    // {
    //   directives: {
    //     defaultSrc: [`'self'`],
    //     styleSrc: [`'self'`, `'unsafe-inline'`],
    //     imgSrc: [`'self'`, "data:", "validator.swagger.io"],
    //     scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
    //   },
    // },
  });

  // Starts listening for shutdown hooks
  if (process.env.NODE_ENV !== "test") {
    app.enableShutdownHooks();
  }

  // Start the server
  const host = process.env.HOST || "0.0.0.0";
  const port = process.env.PORT || 3000;

  await app.listen(port, host);

  logger.log(`API-Gateway is listening on port ${port}`);
}

bootstrap();
