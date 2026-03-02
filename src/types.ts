/**
 * A single unit of work dispatched to a worker agent.
 */
export interface SubTask {
  id: string;
  description: string;
  context?: string;
}

/**
 * The result returned by a worker agent after completing its sub-task.
 */
export interface WorkerResult {
  taskId: string;
  output: string;
  error?: string;
}

/**
 * The final aggregated response from the orchestrator.
 */
export interface OrchestratorResult {
  summary: string;
  results: WorkerResult[];
}
