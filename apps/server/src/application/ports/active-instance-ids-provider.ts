export interface ActiveInstanceIdsProvider {
	list(): Promise<string[]>;
}

