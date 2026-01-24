import type { ExecutionJob } from "../entities/execution-job";

export interface ExecutionJobRepository {
	create(job: ExecutionJob): Promise<void>;
	update(job: ExecutionJob): Promise<void>;
	findById(id: string): Promise<ExecutionJob | null>;
}
