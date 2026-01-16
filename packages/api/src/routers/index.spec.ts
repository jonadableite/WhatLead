import { describe, expect, it, vi } from "vitest";

const prismaTodo = {
	findMany: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
};

vi.mock("@WhatLead/db", () => ({
	default: {
		todo: prismaTodo,
	},
}));

vi.mock("@WhatLead/logger", () => ({
	perfLogger: {
		startTimer: () => ({
			end: vi.fn(),
			fail: vi.fn(),
		}),
	},
	businessLogger: {
		userAction: vi.fn(),
	},
	createChildLogger: () => ({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}),
	logSlowQuery: vi.fn(),
}));

const { appRouter } = await import("./index");

describe("appRouter", () => {
	it("returns OK on healthCheck", async () => {
		const caller = appRouter.createCaller({
			session: null,
			req: { id: "t-1" },
			user: undefined,
			traceId: "t-1",
		});

		await expect(caller.healthCheck()).resolves.toBe("OK");
	});

	it("blocks privateData when no session", async () => {
		const caller = appRouter.createCaller({
			session: null,
			req: { id: "t-1" },
			user: undefined,
			traceId: "t-1",
		});

		await expect(caller.privateData()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("returns privateData when session exists", async () => {
		const caller = appRouter.createCaller({
			session: { user: { id: "u-1" } } as any,
			req: { id: "t-1" },
			user: { id: "u-1" } as any,
			traceId: "t-1",
		});

		await expect(caller.privateData()).resolves.toMatchObject({
			message: "This is private",
			user: { id: "u-1" },
		});
	});
});

describe("todoRouter", () => {
	it("returns todos ordered by id", async () => {
		prismaTodo.findMany.mockResolvedValueOnce([
			{ id: 1, text: "a", completed: false },
			{ id: 2, text: "b", completed: true },
		]);

		const caller = appRouter.createCaller({
			session: null,
			req: { id: "t-1" },
			user: undefined,
			traceId: "t-1",
		});

		const todos = await caller.todo.getAll();
		expect(todos).toHaveLength(2);
		expect(prismaTodo.findMany).toHaveBeenCalledWith({
			orderBy: { id: "asc" },
		});
	});

	it("maps P2025 to NOT_FOUND on toggle", async () => {
		prismaTodo.update.mockRejectedValueOnce({ code: "P2025" });

		const caller = appRouter.createCaller({
			session: null,
			req: { id: "t-1" },
			user: undefined,
			traceId: "t-1",
		});

		await expect(
			caller.todo.toggle({ id: 1, completed: true }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

