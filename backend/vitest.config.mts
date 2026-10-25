import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  // Vite's own transform doesn't emit decorator metadata, which Nest's
  // constructor injection reads. SWC only strips the types: `yarn typecheck`
  // checks them.
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        target: "es2024",
        parser: { syntax: "typescript", decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          // As in tsconfig.json: a field redeclared in a subclass must not
          // overwrite what the base constructor assigned
          useDefineForClassFields: false,
        },
      },
    }),
  ],
  // The path aliases of tsconfig.json
  resolve: {
    alias: {
      "@src": `${root}/src`,
      "@test": `${root}/test`,
      "@shared": `${root}/src/modules/shared`,
      "@modules": `${root}/src/modules`,
      "@db": `${root}/prisma`,
      "@scripts": `${root}/scripts`,
    },
  },
  test: {
    globals: true,
    clearMocks: true,
    bail: 1,
    // More workers gain little: each loads the app again, and the database
    // suites copy the test database once per worker
    maxWorkers: "50%",
    projects: [
      {
        extends: true,
        // Fakes instead of a database
        test: { name: "unit", include: ["test/**/*.unit-spec.ts"] },
      },
      {
        extends: true,
        test: {
          name: "database",
          include: ["test/**/*.inte-spec.ts", "test/**/*.e2e-spec.ts"],
          // One database per worker, copied from the test database
          globalSetup: ["test/globalSetup.ts"],
          setupFiles: ["test/util/useWorkerDatabase.ts"],
        },
      },
    ],
    // On with --coverage. The test:unit, test:inte and test:e2e scripts
    // narrow `include` to the code their suites cover.
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // main.ts only listens; the e2e tests run src/app.setup.ts
      exclude: ["src/configs/**", "src/main.ts"],
      reporter: ["json", "text-summary", "lcov", "clover", "json-summary"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
