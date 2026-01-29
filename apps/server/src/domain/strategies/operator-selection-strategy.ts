import type { Operator } from "../entities/operator";

export interface OperatorSelectionStrategy {
	select(params: { operators: Operator[] }): Operator | null;
}
