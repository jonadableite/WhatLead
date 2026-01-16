import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "api",
		environment: "node",
		include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			reportsDirectory: "../../coverage/api",
		},
	},
});

