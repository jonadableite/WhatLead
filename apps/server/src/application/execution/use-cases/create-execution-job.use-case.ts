import type {
	CreateExecutionJobUseCaseRequest,
	CreateExecutionJobUseCaseResponse,
} from "../../message-execution/create-execution-job.use-case";
import type { ExecutionQueue } from "../ports/execution-queue";

export interface MessageExecutionJobCreator {
	execute(
		request: CreateExecutionJobUseCaseRequest,
	): Promise<CreateExecutionJobUseCaseResponse>;
}

export class CreateExecutionJobUseCase {
	constructor(
		private readonly createJob: MessageExecutionJobCreator,
		private readonly queue: ExecutionQueue,
	) {}

	async execute(
		request: CreateExecutionJobUseCaseRequest,
	): Promise<CreateExecutionJobUseCaseResponse> {
		const result = await this.createJob.execute(request);
		if (result.created) {
			const scheduledAt = request.now ?? new Date();
			await this.queue.enqueue({ jobId: result.jobId, scheduledAt });
		}
		return result;
	}
}
