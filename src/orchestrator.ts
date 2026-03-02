import Anthropic from "@anthropic-ai/sdk";
import { runWorker } from "./worker.js";
import type { SubTask, OrchestratorResult } from "./types.js";

const client = new Anthropic();

/**
 * The orchestrator uses this tool to declare the sub-tasks it wants
 * to dispatch to worker agents in parallel.
 */
const ORCHESTRATOR_TOOLS: Anthropic.Tool[] = [
  {
    name: "dispatch_tasks",
    description:
      "Break the user's request into independent sub-tasks and dispatch them to parallel worker agents. Each task must be self-contained — workers cannot communicate with each other.",
    input_schema: {
      type: "object" as const,
      properties: {
        tasks: {
          type: "array",
          description: "List of sub-tasks to run in parallel.",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Short unique identifier, e.g. 'task-1'.",
              },
              description: {
                type: "string",
                description:
                  "Clear, self-contained instructions for the worker.",
              },
              context: {
                type: "string",
                description:
                  "Optional extra context the worker needs to complete this task.",
              },
            },
            required: ["id", "description"],
          },
        },
      },
      required: ["tasks"],
    },
  },
];

/**
 * Orchestrator agent.
 *
 * 1. Receives a high-level task from the user.
 * 2. Calls `dispatch_tasks` to split it into parallel sub-tasks.
 * 3. Spawns worker agents concurrently via Promise.all.
 * 4. Aggregates worker results into a final summary.
 */
export async function runOrchestrator(
  userTask: string,
  options: { verbose?: boolean } = {}
): Promise<OrchestratorResult> {
  const { verbose = false } = options;

  const systemPrompt = `You are an orchestrator agent. Your job is to:
1. Analyse the user's request.
2. Break it into independent, parallel sub-tasks using the dispatch_tasks tool.
3. Each sub-task must be fully self-contained — workers cannot share state.
4. Aim for 2–6 sub-tasks unless the work is inherently sequential.

Call dispatch_tasks exactly once with all sub-tasks.`;

  if (verbose) console.log("[Orchestrator] Analysing task...");

  // Step 1: Ask the orchestrator to plan the sub-tasks
  const planResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    tools: ORCHESTRATOR_TOOLS,
    messages: [{ role: "user", content: userTask }],
  });

  const dispatchBlock = planResponse.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === "dispatch_tasks"
  );

  if (!dispatchBlock) {
    // Orchestrator answered directly without dispatching — return as-is
    const textBlock = planResponse.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    return {
      summary: textBlock?.text ?? "(no response)",
      results: [],
    };
  }

  const { tasks } = dispatchBlock.input as { tasks: SubTask[] };

  if (verbose) {
    console.log(`[Orchestrator] Dispatching ${tasks.length} parallel tasks:`);
    tasks.forEach((t) => console.log(`  · [${t.id}] ${t.description}`));
  }

  // Step 2: Run all workers in parallel
  const workerResults = await Promise.all(tasks.map((t) => runWorker(t)));

  if (verbose) {
    workerResults.forEach((r) => {
      const status = r.error ? "FAILED" : "OK";
      console.log(`[Worker ${r.taskId}] ${status}`);
    });
  }

  // Step 3: Ask the orchestrator to synthesise the results
  const resultsText = workerResults
    .map((r) =>
      r.error
        ? `[${r.taskId}] ERROR: ${r.error}`
        : `[${r.taskId}]\n${r.output}`
    )
    .join("\n\n---\n\n");

  const summaryMessages: Anthropic.MessageParam[] = [
    { role: "user", content: userTask },
    { role: "assistant", content: planResponse.content },
    {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: dispatchBlock.id,
          content: `All workers have completed. Here are their results:\n\n${resultsText}`,
        },
      ],
    },
  ];

  const summaryResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are an orchestrator agent. Worker agents have completed their tasks.
Synthesise their outputs into a single, coherent final answer for the user.`,
    tools: ORCHESTRATOR_TOOLS,
    messages: summaryMessages,
  });

  const summaryText = summaryResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    summary: summaryText,
    results: workerResults,
  };
}
