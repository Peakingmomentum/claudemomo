/**
 * Entry point — demonstrates the parallel sub-agent system.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npm run dev
 *
 * The orchestrator will break the task below into parallel sub-tasks,
 * run them concurrently, then synthesise a final answer.
 */
import { runOrchestrator } from "./orchestrator.js";

const EXAMPLE_TASK = `
Research and compare three popular TypeScript web frameworks:
Next.js, Remix, and Astro. For each one, cover:
  1. Core use case and philosophy
  2. Key strengths
  3. Main trade-offs

Then provide a recommendation for a content-heavy marketing site.
`.trim();

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  console.log("=== Parallel Sub-Agent System ===\n");
  console.log("Task:", EXAMPLE_TASK);
  console.log("\n" + "─".repeat(50) + "\n");

  const result = await runOrchestrator(EXAMPLE_TASK, { verbose: true });

  console.log("\n" + "─".repeat(50));
  console.log("\n=== Final Answer ===\n");
  console.log(result.summary);

  console.log("\n=== Worker Results ===\n");
  result.results.forEach((r) => {
    const status = r.error ? `ERROR: ${r.error}` : "completed";
    console.log(`[${r.taskId}] ${status}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
