import http from "node:http";
import { runOrchestrator } from "./orchestrator.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function send(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Health check — used by Railway to verify the service is alive
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { status: "ok" });
  }

  // POST /task — submit a task to the orchestrator
  if (req.method === "POST" && url.pathname === "/task") {
    let body: { task?: string };
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return send(res, 400, { error: "Invalid JSON body." });
    }

    if (!body.task || typeof body.task !== "string" || !body.task.trim()) {
      return send(res, 400, { error: 'Missing required field: "task" (string).' });
    }

    console.log(`[server] Task received: ${body.task.slice(0, 80)}...`);

    try {
      const result = await runOrchestrator(body.task, { verbose: true });
      return send(res, 200, result);
    } catch (err) {
      console.error("[server] Orchestrator error:", err);
      return send(res, 500, {
        error: "Orchestrator failed.",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return send(res, 404, { error: "Not found. Use POST /task or GET /health." });
});

server.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
  console.log(`[server] POST /task   — submit a task`);
  console.log(`[server] GET  /health — health check`);
});
