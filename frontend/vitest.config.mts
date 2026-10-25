import { defineConfig } from "vitest/config";

// The Angular builder's Vitest settings, plus these. Vitest starts a worker
// per CPU thread but one, 11 on a 6-core laptop: they shared cores and
// throttled it, and the suite ran no faster than on 4, which leave the
// machine usable meanwhile (CI's 4 CPUs ran 3)
export default defineConfig({
  test: {
    maxWorkers: 4,
  },
});
