import {
  missingImports,
  parseFields,
  registerInModule,
  routeParams,
  scaffoldFiles,
  ScaffoldOptions,
} from "@scripts/scaffold/templates";

// A module that doesn't exist: the files are only text
const command: ScaffoldOptions = {
  module: "task",
  useCase: "completeTask",
  kind: "command",
  route: "tasks/:id/complete",
  method: "post",
  fields: parseFields("date:date,note?:string,assigneeId?:uuid"),
  guard: "roles",
  spec: "unit",
  tag: "Tarefas",
};

const contentOf = (options: ScaffoldOptions, path: string): string =>
  scaffoldFiles(options).find((file) => file.path === path)?.content ?? "";

describe("[Unit] scaffold", () => {
  it("Should read fields and route params", () => {
    expect(parseFields("name:string, qty?:int,")).toEqual([
      { name: "name", type: "string", optional: false },
      { name: "qty", type: "int", optional: true },
    ]);
    expect(() => parseFields("qty:decimal")).toThrow();
    expect(() => parseFields("Qty:int")).toThrow();
    expect(routeParams("tasks/:taskId/notes/:date")).toEqual([
      "taskId",
      "date",
    ]);
  });

  it("Should write a command's files, and add its contract and input to the module's", () => {
    expect(
      scaffoldFiles(command).map(({ path, append }) => [path, !!append]),
    ).toEqual([
      ["src/modules/task/commands/completeTask/completeTask.command.ts", false],
      [
        "src/modules/task/commands/completeTask/completeTask.controller.ts",
        false,
      ],
      ["../packages/contracts/src/task/schemas.ts", true],
      ["../packages/contracts/src/index.ts", true],
      ["src/modules/task/domain/task.entity.ts", true],
      ["test/modules/task/completeTask.command.unit-spec.ts", false],
    ]);
    const handler = contentOf(
      command,
      "src/modules/task/commands/completeTask/completeTask.command.ts",
    );
    expect(handler).toContain('id: [UUID, "id", command.id]');
    expect(handler).toContain("public readonly props: CompleteTaskRequest");
    const controller = contentOf(
      command,
      "src/modules/task/commands/completeTask/completeTask.controller.ts",
    );
    expect(controller).toContain("@UseGuards(RolesGuard)");
    expect(controller).toContain(
      "@ApiBody({ schema: contractRef(CompleteTaskRequest) })",
    );
    const schemas = scaffoldFiles(command).find(
      ({ path }) => path === "../packages/contracts/src/task/schemas.ts",
    );
    expect(schemas?.content).toContain("date: BusinessDate,");
    expect(schemas?.content).toContain(
      "note: z.string().trim().min(1).nullish()",
    );
    expect(schemas?.content).toContain("assigneeId: Id.nullish()");
    expect(schemas?.append?.imports).toContain(
      'import { BusinessDate, Id } from "../common.js";',
    );
    expect(
      contentOf(command, "src/modules/task/domain/task.entity.ts"),
    ).toContain("export const CompleteTaskInput = CompleteTaskRequest;");
  });

  it("Should write a query with its view, and the spec asked for", () => {
    const query: ScaffoldOptions = {
      ...command,
      useCase: "taskList",
      kind: "query",
      route: "tasks",
      method: "get",
      fields: [],
      guard: "auth",
      spec: "e2e",
    };
    expect(scaffoldFiles(query).map(({ path }) => path)).toEqual([
      "src/modules/task/queries/taskList/taskList.query.ts",
      "src/modules/task/queries/taskList/taskList.controller.ts",
      "src/modules/task/domain/taskViews.ts",
      "../packages/contracts/src/task/schemas.ts",
      "../packages/contracts/src/index.ts",
      "test/modules/task/taskList.controller.e2e-spec.ts",
    ]);
    expect(
      contentOf(query, "src/modules/task/queries/taskList/taskList.query.ts"),
    ).toContain("export class TaskListQuery extends Query<TaskListView> {}");
    expect(
      contentOf(
        query,
        "src/modules/task/queries/taskList/taskList.controller.ts",
      ),
    ).toContain("@Answers(TaskListResponse)");
    const e2eSpec = contentOf(
      query,
      "test/modules/task/taskList.controller.e2e-spec.ts",
    );
    expect(e2eSpec).toContain("useE2eApp({ authGuard, resetEachTest: true })");
    expect(e2eSpec).toContain(".expect(HttpStatus.OK)");
    expect(e2eSpec).not.toContain("resetDatabase");
    expect(scaffoldFiles({ ...query, spec: "none" })).toHaveLength(5);
  });

  it("Should import only the names a file lacks", () => {
    const file = `import { z } from "zod";
import {
  BusinessDate,
  Timestamp,
} from "../common.js";
`;
    expect(
      missingImports(file, [
        'import { z } from "zod";',
        'import { BusinessDate, Id } from "../common.js";',
        'import { contract } from "../registry.js";',
        'export * from "./task/schemas.js";',
      ]),
    ).toEqual([
      'import { Id } from "../common.js";',
      'import { contract } from "../registry.js";',
      'export * from "./task/schemas.js";',
    ]);
    expect(
      missingImports('export * from "./task/schemas.js";\n', [
        'export * from "./task/schemas.js";',
      ]),
    ).toEqual([]);
  });

  it("Should register the controller and the handler in the module", () => {
    const module = `const controllers = [
  AController,
];
const commandHandlers = [AHandler];
const queryHandlers = [];
`;
    const registered = registerInModule(module, command) ?? "";
    expect(registered).toContain("AController, CompleteTaskController");
    expect(registered).toContain(
      "const commandHandlers = [AHandler, CompleteTaskHandler];",
    );
    expect(registered).toMatch(
      /^import \{ CompleteTaskHandler \} from "@modules\/task\/commands\/completeTask\/completeTask\.command";/,
    );
    expect(registerInModule(module, { ...command, kind: "query" })).toContain(
      "const queryHandlers = [ CompleteTaskQueryHandler];",
    );
    expect(registerInModule("const controllers = [];", command)).toBeNull();
  });
});
