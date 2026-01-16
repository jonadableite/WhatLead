import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	"./apps/server/vitest.config.ts",
	"./packages/api/vitest.config.ts",
	"./apps/web/vitest.config.ts",
]);

