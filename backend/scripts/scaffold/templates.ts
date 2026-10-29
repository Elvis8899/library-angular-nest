// The files `yarn scaffold` writes for one use case, as text. Pure, so the
// spec can check them without touching the disk; cli.ts writes them

export type UseCaseKind = "command" | "query";
export type FieldType =
  "string" | "number" | "int" | "boolean" | "date" | "uuid";
export type Guard = "roles" | "auth";
export type SpecKind = "unit" | "e2e" | "none";
export type Method = "get" | "post" | "put" | "delete";

export type Field = { name: string; type: FieldType; optional: boolean };

export type ScaffoldOptions = {
  module: string;
  useCase: string;
  kind: UseCaseKind;
  route: string;
  method: Method;
  fields: Field[];
  guard: Guard;
  spec: SpecKind;
  // The Swagger tag, from the module's other controllers when there are some
  tag: string;
};

/** A file to create, or text to add to a file that may already exist. */
export type ScaffoldFile = {
  path: string;
  content: string;
  // Added to the end of an existing file, with `imports` added on top
  append?: { imports: string[] };
};

const fieldTypes: FieldType[] = [
  "string",
  "number",
  "int",
  "boolean",
  "date",
  "uuid",
];

const camelCase = /^[a-z][a-zA-Z0-9]*$/;

export const pascal = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1);

/** `name:string,qty?:int` as fields. */
export const parseFields = (spec: string): Field[] =>
  spec
    .split(",")
    .map((each) => each.trim())
    .filter((each) => each.length > 0)
    .map((each) => {
      const [rawName = "", rawType = "string"] = each.split(":");
      const optional = rawName.endsWith("?");
      const name = optional ? rawName.slice(0, -1) : rawName;
      if (!camelCase.test(name)) throw new Error(`Campo inválido: ${each}`);
      const type = fieldTypes.find((known) => known === rawType);
      if (!type) throw new Error(`Tipo inválido em ${each}: ${rawType}`);
      return { name, type, optional };
    });

/** The `:params` of a route, in order. */
export const routeParams = (route: string): string[] =>
  [...route.matchAll(/:(\w+)/g)].map((match) => match[1] ?? "");

type ParamType = "uuid" | "date" | "string";

const paramType = (param: string): ParamType => {
  if (param === "id" || param.endsWith("Id")) return "uuid";
  if (param === "date") return "date";
  return "string";
};

const paramSchema: Record<ParamType, string> = {
  uuid: "UUID",
  date: "BusinessDate",
  string: "z.string().min(1)",
};

const fieldSchema = ({ type, optional }: Field): string => {
  const base: Record<FieldType, string> = {
    string: "z.string().trim().min(1)",
    number: "z.number()",
    int: "z.number().int()",
    boolean: "z.boolean()",
    date: "BusinessDate",
    uuid: "UUID",
  };
  return optional
    ? `${base[type]}.nullish().transform((value) => value ?? null)`
    : base[type];
};

// The contracts' own names for days and ids
const contractField = (field: Field): string =>
  fieldSchema(field).replace(/^BusinessDate|^UUID/, (name) =>
    name === "UUID" ? "Id" : name,
  );

// What a spec sends: valid, then one value each schema refuses
const sampleField: Record<FieldType, string> = {
  string: '"texto"',
  number: "1",
  int: "1",
  boolean: "true",
  date: '"2026-10-20"',
  uuid: "createTestId(TableNameEnum.None, 1)",
};
const invalidField: Partial<Record<FieldType, string>> = {
  string: '" "',
  number: "Number.NaN",
  int: "1.5",
  date: '"hoje"',
  uuid: '"x"',
};
const sampleParam: Record<ParamType, string> = {
  uuid: "createTestId(TableNameEnum.None, 1)",
  date: '"2026-10-20"',
  string: '"texto"',
};
const urlParam: Record<ParamType, string> = {
  uuid: "99999999-0000-0000-0000-000000000001",
  date: "2026-10-20",
  string: "texto",
};

const imports = (lines: string[]): string => [...new Set(lines)].join("\n");

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** The import lines a file lacks: a named import keeps only the names the
 * file doesn't import from that module yet, so merging them can't repeat
 * one. */
export const missingImports = (current: string, lines: string[]): string[] =>
  lines.flatMap((line) => {
    const named = /^import \{ (.+) \} from "(.+)";$/.exec(line);
    if (!named) return current.includes(line) ? [] : [line];
    const [, names = "", from = ""] = named;
    const imported = [
      ...current.matchAll(
        new RegExp(`import \\{([^}]*)\\} from "${escapeRegExp(from)}"`, "g"),
      ),
    ].flatMap(([, list = ""]) => list.split(",").map((name) => name.trim()));
    const missing = names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => !imported.includes(name));
    return missing.length
      ? [`import { ${missing.join(", ")} } from "${from}";`]
      : [];
  });

/** The names a use case's files use. */
export const namesOf = ({
  useCase,
  kind,
}: Pick<ScaffoldOptions, "useCase" | "kind">) => {
  const name = pascal(useCase);
  return {
    name,
    message: kind === "command" ? name : `${name}Query`,
    handler: kind === "command" ? `${name}Handler` : `${name}QueryHandler`,
    controller: `${name}Controller`,
    input: `${name}Input`,
    // The contract: what the route takes (a command) or answers (a query)
    contract: kind === "command" ? `${name}Request` : `${name}Response`,
    view: `${name}View`,
    folder: kind === "command" ? "commands" : "queries",
  };
};

const validationBlock = (options: ScaffoldOptions, source: string): string => {
  const names = namesOf(options);
  const entries = [
    ...routeParams(options.route).map(
      (param) =>
        `          ${param}: [${paramSchema[paramType(param)]}, "${param}", ${source}.${param}],`,
    ),
    ...(options.fields.length
      ? [`          input: [${names.input}, "${names.name}", ${source}.props],`]
      : []),
  ];
  return entries.length
    ? `        inputsRTE({
${entries.join("\n")}
        }),`
    : "        RTE.right({}),";
};

// The pipeline's parameter, named _… when nothing reads it
const messageParam = (options: ScaffoldOptions, source: string): string =>
  routeParams(options.route).length > 0 || options.fields.length > 0
    ? source
    : `_${source}`;

const handlerImports = (options: ScaffoldOptions): string[] => {
  const names = namesOf(options);
  const params = routeParams(options.route).map(paramType);
  const validates = params.length > 0 || options.fields.length > 0;
  return [
    ...(params.includes("uuid")
      ? ['import { UUID } from "@shared/uuid/uuid";']
      : []),
    ...(params.includes("date")
      ? ['import { BusinessDate } from "@library/contracts";']
      : []),
    ...(params.includes("string") ? ['import { z } from "zod";'] : []),
    ...(options.fields.length
      ? [
          `import { ${names.input} } from "@modules/${options.module}/domain/${options.module}.entity";`,
        ]
      : []),
    ...(validates
      ? ['import { inputsRTE } from "@shared/utils/application/fromInput";']
      : []),
    'import { FPF, RTE } from "@shared/utils/application/monads";',
    'import { UseCaseHandler } from "@shared/utils/application/useCase";',
  ];
};

const commandFile = (options: ScaffoldOptions): string => {
  const names = namesOf(options);
  const params = routeParams(options.route);
  const fields = [
    ...params.map((param) => `    public readonly ${param}: string,`),
    ...(options.fields.length
      ? [`    public readonly props: ${names.contract},`]
      : []),
    "    // The user who asks",
    "    public readonly requesterId: string,",
  ];
  return `${imports([
    ...handlerImports(options),
    ...(options.fields.length
      ? [`import { ${names.contract} } from "@library/contracts";`]
      : []),
    'import { Command, CommandHandler } from "@shared/utils/application/cqrs";',
  ])}

export class ${names.message} extends Command {
  constructor(
${fields.join("\n")}
  ) {
    super();
  }
}

@CommandHandler(${names.message})
export class ${names.handler} extends UseCaseHandler<${names.message}> {
  protected pipeline(${messageParam(options, "command")}: ${names.message}) {
    return FPF.pipe(
${validationBlock(options, "command")}

        //Look the records up, apply the rules (RTE.chainEitherK), store
        //them (perform(this.xRepository).save(…)), then tell the screens
        //that show what changed:
        //RTE.tap(() => changedRTE({ resource: Resource.… })), the resource
        //added to Resource and the frontend's RESOURCE
        RTE.asUnit,
    );
  }
}
`;
};

const queryFile = (options: ScaffoldOptions): string => {
  const names = namesOf(options);
  const params = routeParams(options.route);
  return `${imports([
    ...handlerImports(options),
    `import { ${names.view} } from "@modules/${options.module}/domain/${options.module}Views";`,
    'import { Query, QueryHandler } from "@shared/utils/application/cqrs";',
  ])}

export class ${names.message} extends Query<${names.view}> {${
    params.length
      ? `
  constructor(
${params.map((param) => `    public readonly ${param}: string,`).join("\n")}
  ) {
    super();
  }
`
      : ""
  }}

@QueryHandler(${names.message})
export class ${names.handler} extends UseCaseHandler<${names.message}> {
  protected pipeline(${messageParam(options, "query")}: ${names.message}) {
    return FPF.pipe(
${validationBlock(options, "query")}

        //Read the records (perform(this.xRepository)…), then build the view
        RTE.map((): ${names.view} => ({})),
    );
  }
}
`;
};

const decoratorOf: Record<Method, string> = {
  get: "Get",
  post: "Post",
  put: "Put",
  delete: "Delete",
};

const controllerFile = (options: ScaffoldOptions): string => {
  const names = namesOf(options);
  const params = routeParams(options.route);
  const isCommand = options.kind === "command";
  const hasBody = isCommand && options.fields.length > 0;
  const method = decoratorOf[options.method];
  const guards: Record<Guard, { decorators: string[]; imports: string[] }> = {
    roles: {
      decorators: ["  @UseGuards(RolesGuard)", "  @Roles(UserRoleEnum.Admin)"],
      imports: [
        'import { Roles } from "@modules/auth/decorators/roles.decorator";',
        'import { RolesGuard } from "@modules/auth/guards/roles.guard";',
        'import { UserRoleEnum } from "@modules/user/domain/user.entity";',
      ],
    },
    auth: { decorators: [], imports: [] },
  };
  const guard = guards[options.guard];
  const args = [
    ...params.map((param) => `    @Param("${param}") ${param}: string,`),
    ...(hasBody ? [`    @Body() body: ${names.contract},`] : []),
    ...(isCommand ? ["    @Request() req: AuthenticatedRequest,"] : []),
  ];
  const messageArgs = [
    ...params,
    ...(hasBody ? ["body"] : []),
    ...(isCommand ? ["req.user.sub"] : []),
  ].join(", ");
  const nestImports = [
    method,
    ...(params.length ? ["Param"] : []),
    ...(hasBody ? ["Body"] : []),
    ...(isCommand ? ["HttpCode", "HttpStatus", "Request"] : []),
  ];
  const swagger = [
    "ApiOperation",
    ...(hasBody ? ["ApiBody"] : []),
    ...(isCommand ? ["ApiDefaultResponse"] : []),
  ];
  const contracts = [
    ...(hasBody ? ["contractRef"] : []),
    ...(hasBody || !isCommand ? [names.contract] : []),
  ];
  const body = isCommand
    ? `    return this.commandBus.execute(new ${names.message}(${messageArgs}));`
    : `    return this.queryBus.execute(new ${names.message}(${messageArgs}));`;
  return `${imports([
    'import { ApiController } from "@modules/auth/decorators/apiController.decorator";',
    ...(isCommand
      ? [
          'import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";',
        ]
      : []),
    ...guard.imports,
    `import { ${names.message} } from "@modules/${options.module}/${names.folder}/${options.useCase}/${options.useCase}.${options.kind}";`,
    ...(contracts.length
      ? [`import { ${contracts.join(", ")} } from "@library/contracts";`]
      : []),
    `import { ${nestImports.join(", ")} } from "@nestjs/common";`,
    `import { ${isCommand ? "CommandBus" : "QueryBus"} } from "@shared/utils/application/cqrs";`,
    `import { ${swagger.join(", ")} } from "@nestjs/swagger";`,
    ...(isCommand
      ? []
      : ['import { Answers } from "@shared/utils/http/answers";']),
  ])}

@ApiController("${options.tag}")
export class ${names.controller} {
  constructor(private readonly ${isCommand ? "commandBus: CommandBus" : "queryBus: QueryBus"}) {}

  @${method}("${options.route}")
${[
  ...guard.decorators,
  ...(isCommand ? ["  @HttpCode(HttpStatus.OK)"] : []),
  ...(hasBody
    ? [`  @ApiBody({ schema: contractRef(${names.contract}) })`]
    : []),
].join("\n")}
  @ApiOperation({ summary: "${names.name}" })
  ${
    isCommand
      ? '@ApiDefaultResponse({ description: "Feito." })'
      : `@Answers(${names.contract})`
  }
  async ${options.useCase}(
${args.join("\n")}
  )${isCommand ? ": Promise<void>" : ""} {
${body}
  }
}
`;
};

const sampleCall = (options: ScaffoldOptions, invalid: boolean): string => {
  const names = namesOf(options);
  const params = routeParams(options.route);
  const invalidParam = invalid && params.length > 0;
  const firstInvalidField = options.fields.find(
    (field) => invalidField[field.type] !== undefined,
  );
  const args = [
    ...params.map((param, index) =>
      invalidParam && index === 0
        ? paramType(param) === "string"
          ? '""'
          : '"inválido"'
        : sampleParam[paramType(param)],
    ),
    ...(options.fields.length
      ? [
          `{ ${options.fields
            .map((field) =>
              invalid && !invalidParam && field === firstInvalidField
                ? `${field.name}: ${invalidField[field.type] ?? ""}`
                : `${field.name}: ${sampleField[field.type]}`,
            )
            .join(", ")} }`,
        ]
      : []),
    ...(options.kind === "command" ? ["requesterId"] : []),
  ];
  return `new ${names.message}(${args.join(", ")})`;
};

const canBeInvalid = (options: ScaffoldOptions): boolean =>
  routeParams(options.route).length > 0 ||
  options.fields.some((field) => invalidField[field.type] !== undefined);

const unitSpecFile = (options: ScaffoldOptions): string => {
  const names = namesOf(options);
  const isCommand = options.kind === "command";
  const usesIds =
    isCommand ||
    routeParams(options.route).some((param) => paramType(param) === "uuid") ||
    options.fields.some((field) => field.type === "uuid");
  const invalid = canBeInvalid(options);
  return `${imports([
    `import { ${names.message}, ${names.handler} } from "@modules/${options.module}/${names.folder}/${options.useCase}/${options.useCase}.${options.kind}";`,
    ...(invalid
      ? ['import { UnprocessableEntityException } from "@nestjs/common";']
      : []),
    ...(usesIds
      ? ['import { createTestId, TableNameEnum } from "@test/util/defaultIds";']
      : []),
    'import { useHandlerModule } from "@test/util/handlerModule";',
  ])}
${isCommand ? "\nconst requesterId = createTestId(TableNameEnum.User, 1);\n" : ""}
describe("[Unit] ${names.name}", () => {
  const ctx = useHandlerModule(
    { providers: [${names.handler}] },
    (get) => ({ handler: get(${names.handler}) }),
  );

  it("Should ${isCommand ? "do it" : "answer the view"}", async () => {
    await expect(
      ctx.handler.execute(${sampleCall(options, false)}),
    ).resolves.${isCommand ? "toBeUndefined()" : "toEqual({})"};
  });
${
  invalid
    ? `
  it("Should refuse invalid input", async () => {
    await expect(
      ctx.handler.execute(${sampleCall(options, true)}),
    ).rejects.toThrow(UnprocessableEntityException);
  });
`
    : ""
}});
`;
};

const e2eSpecFile = (options: ScaffoldOptions): string => {
  const names = namesOf(options);
  const url = options.route.replace(
    /:(\w+)/g,
    (_, param: string) => urlParam[paramType(param)],
  );
  const body = options.fields.length
    ? `.send({ ${options.fields
        .map((field) =>
          field.type === "uuid"
            ? `${field.name}: "${urlParam.uuid}"`
            : `${field.name}: ${sampleField[field.type]}`,
        )
        .join(", ")} })`
    : "";
  return `import { HttpStatus } from "@nestjs/common";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

const authGuard = new MockAuthGuardBuilder();
const e2e = useE2eApp({ authGuard });

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
  authGuard.reset();
});

describe("[e2e] ${options.method.toUpperCase()} /v1/${options.route}", () => {
  it("Should answer ${names.name}", async () => {
    const response = await e2e.http().${options.method}("/v1/${url}")${body};
    expect(response.status).toBe(HttpStatus.OK);
  });
});
`;
};

// The contracts package, from the backend's folder
const contracts = "../packages/contracts/src";

/** The contract appended to the module's schemas, and the module's
 * schemas exported by the package when they're new. */
const contractFiles = (
  options: ScaffoldOptions,
  schema: string,
  fields: Field[],
): ScaffoldFile[] => {
  const names = namesOf(options);
  const common = [
    ...(fields.some((field) => field.type === "date") ? ["BusinessDate"] : []),
    ...(fields.some((field) => field.type === "uuid") ? ["Id"] : []),
  ];
  return [
    {
      path: `${contracts}/${options.module}/schemas.ts`,
      content: `
export const ${names.contract} = contract(${schema}, { id: "${names.contract}" });
export type ${names.contract} = z.input<typeof ${names.contract}>;
`,
      append: {
        imports: [
          'import { z } from "zod";',
          ...(common.length
            ? [`import { ${common.join(", ")} } from "../common.js";`]
            : []),
          'import { contract } from "../registry.js";',
        ],
      },
    },
    {
      path: `${contracts}/index.ts`,
      content: "",
      append: {
        imports: [`export * from "./${options.module}/schemas.js";`],
      },
    },
  ];
};

/** What the module's existing files get. */
const additions = (options: ScaffoldOptions): ScaffoldFile[] => {
  const names = namesOf(options);
  const base = `src/modules/${options.module}`;
  if (options.kind === "command")
    return options.fields.length
      ? [
          ...contractFiles(
            options,
            `z.object({
${options.fields.map((field) => `  ${field.name}: ${contractField(field)},`).join("\n")}
})`,
            options.fields,
          ),
          {
            path: `${base}/domain/${options.module}.entity.ts`,
            content: `
export const ${names.input} = ${names.contract};
export type ${names.input} = z.output<typeof ${names.contract}>;
`,
            append: {
              imports: [
                `import { ${names.contract} } from "@library/contracts";`,
                'import { z } from "zod";',
              ],
            },
          },
        ]
      : [];
  return [
    {
      path: `${base}/domain/${options.module}Views.ts`,
      content: `
// What ${names.name} answers
export type ${names.view} = Record<string, never>;
`,
      append: { imports: [] },
    },
    // Its fields promise ${names.view}'s
    ...contractFiles(options, "z.object({})", []),
  ];
};

/** Every file the use case gets, new ones and additions. */
export const scaffoldFiles = (options: ScaffoldOptions): ScaffoldFile[] => {
  const names = namesOf(options);
  const folder = `src/modules/${options.module}/${names.folder}/${options.useCase}`;
  const spec: Record<SpecKind, ScaffoldFile[]> = {
    unit: [
      {
        path: `test/modules/${options.module}/${options.useCase}.${options.kind}.unit-spec.ts`,
        content: unitSpecFile(options),
      },
    ],
    e2e: [
      {
        path: `test/modules/${options.module}/${options.useCase}.controller.e2e-spec.ts`,
        content: e2eSpecFile(options),
      },
    ],
    none: [],
  };
  return [
    {
      path: `${folder}/${options.useCase}.${options.kind}.ts`,
      content:
        options.kind === "command" ? commandFile(options) : queryFile(options),
    },
    {
      path: `${folder}/${options.useCase}.controller.ts`,
      content: controllerFile(options),
    },
    ...additions(options),
    ...spec[options.spec],
  ];
};

/** The module file with the new controller and handler in its arrays and
 * their imports on top, or null when its arrays aren't there. */
export const registerInModule = (
  moduleFile: string,
  options: ScaffoldOptions,
): string | null => {
  const names = namesOf(options);
  const handlers =
    options.kind === "command" ? "commandHandlers" : "queryHandlers";
  // Before the array's closing bracket; prettier lays it out afterwards
  const addTo = (text: string, array: string, entry: string): string | null => {
    const opening = text.indexOf(`const ${array} = [`);
    const closing = opening < 0 ? -1 : text.indexOf("];", opening);
    if (closing < 0) return null;
    const before = text.slice(0, closing).trimEnd();
    const separator = before.endsWith("[") || before.endsWith(",") ? "" : ",";
    return `${before}${separator} ${entry}${text.slice(closing)}`;
  };
  const withController = addTo(moduleFile, "controllers", names.controller);
  const withHandler =
    withController && addTo(withController, handlers, names.handler);
  if (!withHandler) return null;
  const folder = `@modules/${options.module}/${names.folder}/${options.useCase}/${options.useCase}`;
  return `import { ${names.handler} } from "${folder}.${options.kind}";
import { ${names.controller} } from "${folder}.controller";
${withHandler}`;
};
