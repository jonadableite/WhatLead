import type { CompanyStatus } from "../value-objects/company-status";

export class Company {
	constructor(
		public readonly id: string,
		public name: string,
		public email: string,
		public phone: string,
		public status: CompanyStatus,
		public readonly createdAt: Date,
	) {}

	activate() {
		this.status = "ACTIVE";
	}

	suspend() {
		this.status = "SUSPENDED";
	}
}
