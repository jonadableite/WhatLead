import { describe, expect, it, vi } from "vitest";
import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";

const prismaReputationSignal = {
	create: vi.fn(async () => ({})),
	findMany: vi.fn(async () => []),
	deleteMany: vi.fn(async () => ({ count: 0 })),
};

vi.mock("@WhatLead/db", () => ({
	default: {
		reputationSignal: prismaReputationSignal,
	},
}));

const { PrismaReputationSignalRepository } = await import(
	"./prisma-reputation-signal-repository"
);

describe("PrismaReputationSignalRepository", () => {
	it("creates signal row on append", async () => {
		const repo = new PrismaReputationSignalRepository(7);
		const signal: ReputationSignal = {
			type: "MESSAGE_SENT",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:00:00.000Z"),
			messageId: "m-1",
			remoteJid: "t",
			isGroup: false,
			latencyMs: 123.4,
		};

		await repo.append(signal);

		expect(prismaReputationSignal.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					instanceId: "i-1",
					type: "MESSAGE_SENT",
					messageId: "m-1",
					remoteJid: "t",
					isGroup: false,
					latencyMs: 123,
				}),
			}),
		);
	});

	it("queries window by instanceId and occurredAt", async () => {
		prismaReputationSignal.findMany.mockResolvedValueOnce([
			{
				instanceId: "i-1",
				occurredAt: new Date("2026-01-16T00:00:00.000Z"),
				type: "MESSAGE_SENT",
				messageId: null,
				remoteJid: null,
				isGroup: false,
				latencyMs: null,
			},
		]);

		const repo = new PrismaReputationSignalRepository(7);
		const since = new Date("2026-01-16T00:00:00.000Z");
		const until = new Date("2026-01-16T01:00:00.000Z");
		const result = await repo.getWindow({ instanceId: "i-1", since, until });

		expect(prismaReputationSignal.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					instanceId: "i-1",
					occurredAt: { gte: since, lte: until },
				}),
			}),
		);
		expect(result).toHaveLength(1);
		expect(result[0]?.type).toBe("MESSAGE_SENT");
	});
});

