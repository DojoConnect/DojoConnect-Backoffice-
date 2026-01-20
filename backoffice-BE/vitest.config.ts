import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    dir: "./src",
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
    },
  },
});
