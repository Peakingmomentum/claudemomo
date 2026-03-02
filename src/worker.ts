import Anthropic from "@anthropic-ai/sdk";
import type { SubTask, WorkerResult } from "./types.js";

const client = new Anthropic();

/**
 * Tools that our application layer handles (not MCP tools).
 * MCP tools are declared separately and handled server-side by Anthropic's API.
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
 * Builds the Smithery Gmail MCP server entry if SMITHERY_API_KEY is set.
 * Returns an empty array when the key is absent so the worker still runs
 * without Gmail access.
 */
function buildGmailMcpServer(): Array<{
  type: "url";
  url: string;
  name: string;
}> {
  const key = process.env.SMITHERY_API_KEY;
  if (!key) return [];
  return [
    {
      type: "url",
      url: `https://server.smithery.ai/@shinzo-labs/gmail-mcp/mcp?api_key=${encodeURIComponent(key)}`,
      name: "gmail",
    },
  ];
}

/**
 * Runs a single worker agent that processes one sub-task.
 * The agent loops until it calls `report_result` or exhausts max turns.
 *
 * When SMITHERY_API_KEY is set the worker also has access to Gmail MCP tools.
 * MCP tool calls are handled transparently server-side by Anthropic's API —
 * our loop only needs to intercept the custom `report_result` tool.
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

  const gmailMcpServers = buildGmailMcpServer();
  const hasGmail = gmailMcpServers.length > 0;

  // Build the tools array: always include report_result; add the Gmail MCP
  // toolset when the key is present so Claude can use Gmail tools.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [
    ...WORKER_TOOLS,
    ...(hasGmail ? [{ type: "mcp_toolset", mcp_server_name: "gmail" }] : []),
  ];

  for (let turn = 0; turn < maxTurns; turn++) {
    // Use client.beta.messages for MCP support; the beta API is backwards
    // compatible with the regular messages API so this is safe when
    // mcp_servers is an empty array (no Gmail key set).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: Anthropic.Message = await (client as any).beta.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        ...(hasGmail && { mcp_servers: gmailMcpServers }),
        messages,
      },
      {
        headers: { "anthropic-beta": "mcp-client-2025-11-20" },
      }
    );

    // Collect tool uses our application must handle (only report_result).
    // Gmail MCP tool calls are resolved server-side and never appear here.
    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

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
