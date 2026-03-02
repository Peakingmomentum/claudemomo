# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

---

## Repository Overview

**Name:** claudemomo
**Purpose:** Parallel sub-agent orchestration system using the Anthropic SDK.
**Runtime:** Node.js 20+, TypeScript (ESM)
**Remote:** `Peakingmomentum/claudemomo`

---

## Project Structure

```
/
├── src/
│   ├── index.ts          # Entry point — example usage
│   ├── orchestrator.ts   # Orchestrator agent (plans + aggregates)
│   ├── worker.ts         # Worker agent (executes one sub-task)
│   └── types.ts          # Shared TypeScript interfaces
├── dist/                 # Compiled JS output (git-ignored)
├── package.json
├── tsconfig.json
├── .gitignore
└── CLAUDE.md             # This file
```

---

## Architecture

```
User Task
    │
    ▼
Orchestrator Agent
    │  calls dispatch_tasks tool
    ▼
┌──────────────────────────────────┐
│  Promise.all (parallel workers)  │
│  ┌──────────┐  ┌──────────┐  …  │
│  │ Worker 1 │  │ Worker 2 │      │
│  └──────────┘  └──────────┘      │
└──────────────────────────────────┘
    │  all results collected
    ▼
Orchestrator Agent (synthesis pass)
    │
    ▼
Final Answer
```

### Key files

| File | Role |
|---|---|
| `src/orchestrator.ts` | Calls Claude to plan sub-tasks, fans out to workers via `Promise.all`, then asks Claude to synthesise results |
| `src/worker.ts` | Runs one focused Claude agent loop until it calls `report_result` |
| `src/types.ts` | `SubTask`, `WorkerResult`, `OrchestratorResult` |
| `src/index.ts` | Wires everything together with an example task |

---

## Development Workflow

### Prerequisites

- Node.js 20+
- `ANTHROPIC_API_KEY` environment variable set

### Setup

```bash
npm install
```

### Running

```bash
# Run with ts-node (no compile step)
ANTHROPIC_API_KEY=sk-... npm run dev

# Compile then run
npm run build
ANTHROPIC_API_KEY=sk-... npm start
```

### Type-checking

```bash
npm run typecheck
```

### Extending the system

- **Add worker tools:** Edit `WORKER_TOOLS` in `src/worker.ts`.
- **Change the model:** Update the `model` field in `client.messages.create` calls.
- **Cap concurrency:** Wrap `Promise.all` with a concurrency limiter (e.g. `p-limit`).
- **Custom task:** Edit `EXAMPLE_TASK` in `src/index.ts` or call `runOrchestrator` directly.

---

## Branch Strategy

- **Feature development:** Always work on a dedicated branch, never commit directly to `main`.
- **Branch naming:** `feature/<short-description>`, `fix/<issue-id>`, or `claude/<session-id>`.
- **Current AI branch:** `claude/claude-md-mm8oxmrnhgfem9m3-En1K1`

### Pushing

```bash
git push -u origin <branch-name>
```

If push fails due to a network error, retry up to 4 times with exponential backoff: 2 s, 4 s, 8 s, 16 s.

---

## AI Assistant Instructions

### General Principles

1. **Read before editing.** Always read a file before modifying it.
2. **Minimal changes.** Only change what is explicitly requested or clearly necessary.
3. **No speculative features.** Do not add abstractions, logging, or utilities for hypothetical needs.
4. **Security first.** Never introduce OWASP Top 10 vulnerabilities. Fix any noticed immediately.
5. **Confirm before destructive actions.** Force-push, file deletion, etc. — confirm first.

### File Operations

| Task | Preferred tool |
|---|---|
| Read a file | `Read` tool |
| Edit a file | `Edit` tool |
| Create a file | `Write` tool |
| Search files | `Glob` tool |
| Search content | `Grep` tool |

### Git Operations

- Check `git status` and `git diff` before committing.
- Stage specific files — never `git add -A` blindly.
- Never commit `.env` or credential files.
- Use HEREDOC format for commit messages:

```bash
git commit -m "$(cat <<'EOF'
Short summary line

Optional longer description.
EOF
)"
```

---

## Key Conventions

- **Language/runtime:** TypeScript, Node.js 20+, ESM (`"type": "module"`)
- **Module format:** `.js` extensions in import paths (TypeScript ESM requirement)
- **Package manager:** npm
- **Model:** `claude-sonnet-4-6` (update as newer models release)
- **API style:** Direct Anthropic SDK — no framework abstraction layer

---

## Updating This File

Keep CLAUDE.md current. Update it when:

- New top-level directories or major modules are added.
- Build, test, or run commands change.
- New conventions are adopted.
- Environment variables or external dependencies are introduced.
