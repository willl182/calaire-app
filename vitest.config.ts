import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "convex/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    passWithNoTests: true,
  },
});
