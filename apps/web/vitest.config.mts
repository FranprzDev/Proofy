import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const stub = fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": src, "server-only": stub } },
  test: { include: ["tests/**/*.test.ts"] },
});
