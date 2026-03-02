import Anthropic from "@anthropic-ai/sdk";
import type { SubTask, WorkerResult } from "./types.js";

const client = new Anthropic();

/**
 * Tools available to every worker agent.
 * Extend this array to give workers more capabilities.
 */
const WORKER_TOOLS: Anthropic.Tool[] = [
  {
    name: "report_result",
    description:
      "Call this tool when you have completed your assigned task and are ready to return the result.",
    input_schema: {
      type: "object" as const,
      properties: {
        result: {
          type: "string",
          description: "The final result or output of the task.",
        },
      },
      required: ["result"],
    },
  },
];

/**
 * Runs a single worker agent that processes one sub-task.
 * The agent loops until it calls `report_result` or exhausts max turns.
 */
export async function runWorker(
  task: SubTask,
  maxTurns = 10
): Promise<WorkerResult> {
  const systemPrompt = `You are a focused worker agent. You will receive a single task and must complete it thoroughly.
When you are done, call the report_result tool with your final output.
Do not ask clarifying questions — use your best judgment and complete the task.`;

  const userMessage = task.context
    ? `Task: ${task.description}\n\nAdditional context:\n${task.context}`
    : `Task: ${task.description}`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      tools: WORKER_TOOLS,
      messages,
    });

    // Collect any tool uses from this response
    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    // Check if the agent called report_result
    const reportBlock = toolUses.find((t) => t.name === "report_result");
    if (reportBlock) {
      const input = reportBlock.input as { result: string };
      return { taskId: task.id, output: input.result };
    }

    // If the model stopped without tool use, treat the text as the result
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      return {
        taskId: task.id,
        output: textBlock?.text ?? "(no output)",
      };
    }

    // Continue the agentic loop: append assistant response and tool results
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((t) => ({
      type: "tool_result" as const,
      tool_use_id: t.id,
      content: `Tool "${t.name}" acknowledged.`,
    }));

    messages.push({ role: "user", content: toolResults });
  }

  return {
    taskId: task.id,
    output: "",
    error: `Worker exceeded max turns (${maxTurns}) without completing the task.`,
  };
}
