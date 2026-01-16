export const COMPANY_STATUSES = [
	"ACTIVE",
	"SUSPENDED",
	"CANCELED",
	"TRIAL",
] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number];
