import type { ExecutionControl } from "../entities/execution-control";
import type { ExecutionControlScope } from "../value-objects/execution-control-scope";

export interface ExecutionControlRepository {
	findByScope(scope: ExecutionControlScope, scopeId: string): Promise<ExecutionControl | null>;
	upsert(control: ExecutionControl): Promise<void>;
}

