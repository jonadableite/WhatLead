import type { CampaignStatus } from "../value-objects/campaign-status";

export class Campaign {
	constructor(
		public readonly id: string,
		public readonly companyId: string,
		public name: string,
		public description: string | null,
		public status: CampaignStatus,
		public instanceId: string,
		public startDate: Date | null,
		public endDate: Date | null,
		public readonly createdAt: Date,
	) {}

	activate() {
		if (this.status !== "SCHEDULED" && this.status !== "PAUSED") {
			throw new Error("Campaign cannot be activated");
		}

		this.status = "ACTIVE";
	}

	pause() {
		if (this.status !== "ACTIVE") {
			throw new Error("Only active campaigns can be paused");
		}

		this.status = "PAUSED";
	}

	finish() {
		this.status = "FINISHED";
	}

	cancel() {
		if (this.status === "FINISHED") {
			throw new Error("Finished campaigns cannot be canceled");
		}

		this.status = "CANCELED";
	}
}
