import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	test: {
		name: "web",
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		include: ["src/**/*.spec.tsx", "src/**/*.test.tsx", "src/**/*.spec.ts", "src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			reportsDirectory: "../../coverage/web",
		},
	},
});

