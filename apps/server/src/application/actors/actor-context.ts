export const ACTOR_TYPES = ["AGENT", "OPERATOR", "SYSTEM"] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export interface ActorContext {
	actorType: ActorType;
	actorId?: string;
	tenantId: string;
}

