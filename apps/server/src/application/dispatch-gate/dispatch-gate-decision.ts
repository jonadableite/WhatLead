import type { DispatchBlockReason } from "../../domain/value-objects/dispatch-block-reason";

export type DispatchGateDecision =
	| { allowed: true }
	| { allowed: false; reason: DispatchBlockReason; delayedUntil?: Date };

