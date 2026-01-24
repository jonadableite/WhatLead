import { ExecutionControl } from "../../domain/entities/execution-control";
import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";
import type { ExecutionControlScope } from "../../domain/value-objects/execution-control-scope";

export class InMemoryExecutionControlRepository implements ExecutionControlRepository {
	private readonly store = new Map<string, ExecutionControl>();

	private key(scope: ExecutionControlScope, scopeId: string): string {
		return `${scope}:${scopeId}`;
	}

	async findByScope(scope: ExecutionControlScope, scopeId: string): Promise<ExecutionControl | null> {
		return this.store.get(this.key(scope, scopeId)) ?? null;
	}

	async upsert(control: ExecutionControl): Promise<void> {
		this.store.set(this.key(control.scope, control.scopeId), control);
	}
}

