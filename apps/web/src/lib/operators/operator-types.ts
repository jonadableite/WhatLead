export type OperatorStatus = "ONLINE" | "AWAY" | "OFFLINE";

export interface OperatorListItem {
	id: string;
	userId: string;
	name: string;
	status: OperatorStatus;
	maxConcurrentConversations: number;
	currentConversationCount: number;
}

export interface ListOperatorsResponse {
	items: OperatorListItem[];
}

export interface OperatorMeResponse {
	operator: OperatorListItem | null;
}
