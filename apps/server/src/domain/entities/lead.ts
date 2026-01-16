import type { LeadStage } from "../value-objects/lead-stage";

export class Lead {
	constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly campaignId: string | null,
		public name: string,
		public email: string,
		public phone: string,
		public stage: LeadStage,
		public readonly createdAt: Date,
	) {}
}
