import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" path alias so tests import the same
    // way the app does.
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
