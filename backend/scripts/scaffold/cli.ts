import {
  Guard,
  Method,
  missingImports,
  parseFields,
  registerInModule,
  ScaffoldFile,
  scaffoldFiles,
  ScaffoldOptions,
  SpecKind,
  UseCaseKind,
} from "@scripts/scaffold/templates";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const usage = `Uso: yarn scaffold <module> <useCase> command|query [opções]

  --route <rota>      depois de v1/, com :params (padrão: <module>)
  --method <m>        get, post, put ou delete (padrão: post num command, get numa query)
  --fields <campos>   o corpo de um command: nome:tipo, com ? se opcional
                      (string, number, int, boolean, date, uuid), ex. "name:string,qty?:int"
  --guard <g>         roles (só administradores) ou auth (qualquer usuário logado; padrão)
  --spec <s>          unit, e2e ou none (padrão: unit)
  --tag <tag>         a tag do Swagger (padrão: a dos outros controllers do módulo)

Ex.: yarn scaffold user renameUser command --route "users/:id/name" --method put --fields "name:string" --guard roles`;

const camelCase = /^[a-z][a-zA-Z0-9]*$/;
const root = join(__dirname, "..", "..");

const fail = (message: string): never => {
  console.error(`${message}\n\n${usage}`);
  process.exit(1);
};

const pick = <T extends string>(
  value: string,
  allowed: readonly T[],
  flag: string,
): T =>
  allowed.find((each) => each === value) ?? fail(`${flag} inválido: ${value}`);

const parseArgs = (argv: string[]): ScaffoldOptions => {
  const positional: string[] = [];
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index] ?? "";
    if (arg.startsWith("--")) flags.set(arg.slice(2), argv[++index] ?? "");
    else positional.push(arg);
  }
  const [module = "", useCase = "", rawKind = ""] = positional;
  if (!camelCase.test(module) || !camelCase.test(useCase))
    fail("O módulo e o caso de uso são camelCase.");
  const kind = pick<UseCaseKind>(rawKind, ["command", "query"], "Tipo");
  const route = flags.get("route") ?? module;
  return {
    module,
    useCase,
    kind,
    route,
    method: pick<Method>(
      flags.get("method") ?? (kind === "command" ? "post" : "get"),
      ["get", "post", "put", "delete"],
      "--method",
    ),
    fields: kind === "command" ? parseFields(flags.get("fields") ?? "") : [],
    guard: pick<Guard>(
      flags.get("guard") ?? "auth",
      ["roles", "auth"],
      "--guard",
    ),
    spec: pick<SpecKind>(
      flags.get("spec") ?? "unit",
      ["unit", "e2e", "none"],
      "--spec",
    ),
    tag: flags.get("tag") ?? existingTag(module) ?? module,
  };
};

// The Swagger tag the module's controllers already use
const existingTag = (module: string): string | undefined => {
  const base = join(root, "src/modules", module);
  const controllers = ["commands", "queries"]
    .map((folder) => join(base, folder))
    .filter(existsSync)
    .flatMap((folder) =>
      readdirSync(folder, { recursive: true, encoding: "utf8" })
        .filter((file) => file.endsWith(".controller.ts"))
        .map((file) => join(folder, file)),
    );
  for (const file of controllers) {
    const tag = /@ApiController\("([^"]+)"/.exec(
      readFileSync(file, "utf8"),
    )?.[1];
    if (tag) return tag;
  }
  return undefined;
};

const write = ({ path, content, append }: ScaffoldFile): string => {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  if (!append) {
    writeFileSync(file, content);
    return file;
  }
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  const missing = missingImports(current, append.imports);
  writeFileSync(
    file,
    `${missing.join("\n")}${missing.length ? "\n" : ""}${current}${content}`,
  );
  return file;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const files = scaffoldFiles(options);
  // Nothing is written when any new file is already there
  const taken = files.filter(
    ({ path, append }) => !append && existsSync(join(root, path)),
  );
  if (taken.length)
    fail(`Já existe: ${taken.map(({ path }) => path).join(", ")}`);
  const written = files.map(write);

  const moduleFile = join(
    root,
    "src/modules",
    options.module,
    `${options.module}.module.ts`,
  );
  const notes: string[] = [];
  if (existsSync(moduleFile)) {
    const registered = registerInModule(
      readFileSync(moduleFile, "utf8"),
      options,
    );
    if (registered) {
      writeFileSync(moduleFile, registered);
      written.push(moduleFile);
    } else
      notes.push(
        `Registre o controller e o handler em ${options.module}.module.ts.`,
      );
  } else
    notes.push(
      `Crie src/modules/${options.module}/${options.module}.module.ts e registre-o em src/app.module.ts.`,
    );

  // Sorts and merges the imports, and lays the code out
  execFileSync("npx", ["prettier", "--write", ...written], {
    cwd: root,
    stdio: "ignore",
  });

  console.log(
    [
      "Arquivos:",
      ...written.map((file) => `  ${relative(root, file)}`),
      "",
      "Falta: as regras (domain/), o repositório e as respostas de erro no Swagger;",
      "o teste gerado é só o começo. Rode yarn contracts:build (na raiz) para os apps verem o contrato.",
      ...notes,
    ].join("\n"),
  );
};

main();
