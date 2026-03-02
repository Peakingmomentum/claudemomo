# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

---

## Repository Overview

**Name:** claudemomo
**Status:** Newly initialized — no source code has been added yet.
**Remote:** `Peakingmomentum/claudemomo`

This repository is empty. The sections below serve as a living template: update each section as the project grows.

---

## Project Structure (to be filled in)

Once code is added, document the layout here. Example template:

```
/
├── src/              # Application source code
├── tests/            # Test suites
├── docs/             # Documentation
├── scripts/          # Utility/build scripts
├── .github/          # CI/CD workflows
├── CLAUDE.md         # This file
└── README.md         # Human-facing project overview
```

Update this tree whenever new top-level directories or major modules are introduced.

---

## Development Workflow

### Branch Strategy

- **Feature development:** Always work on a dedicated branch, never commit directly to `main`.
- **Branch naming:** Use descriptive names, e.g. `feature/<short-description>`, `fix/<issue-id>`, or `claude/<session-id>` for AI-generated branches.
- **Current AI branch:** `claude/claude-md-mm8oxmrnhgfem9m3-En1K1`

### Committing

- Write clear, imperative-mood commit messages (e.g. "Add user authentication module").
- Keep commits focused — one logical change per commit.
- Never skip pre-commit hooks (`--no-verify`) unless explicitly instructed.

### Pushing

```bash
git push -u origin <branch-name>
```

- If push fails due to network error, retry up to 4 times with exponential backoff: 2 s, 4 s, 8 s, 16 s.
- Never force-push to `main` or shared branches.

---

## AI Assistant Instructions

### General Principles

1. **Read before editing.** Always read a file before modifying it. Never assume its contents.
2. **Minimal changes.** Only change what is explicitly requested or clearly necessary. Do not refactor, add comments, or clean up surrounding code unless asked.
3. **No speculative features.** Do not add error handling, logging, abstractions, or utilities for hypothetical future needs.
4. **Security first.** Never introduce SQL injection, XSS, command injection, or other OWASP Top 10 vulnerabilities. Fix any such issues immediately if noticed.
5. **Confirm before destructive actions.** For irreversible operations (deleting files, force-pushing, dropping data), confirm with the user first.

### File Operations

| Task | Preferred tool |
|---|---|
| Read a file | `Read` tool (not `cat`) |
| Edit a file | `Edit` tool (not `sed`) |
| Create a file | `Write` tool (not `echo >`) |
| Search files | `Glob` tool (not `find`) |
| Search content | `Grep` tool (not `grep`) |

### Git Operations

- Check `git status` and `git diff` before committing.
- Stage specific files rather than `git add -A` to avoid accidentally including secrets.
- Never commit `.env` files or credential files.
- Always use the HEREDOC format for commit messages to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
Short summary line

Optional longer description.
EOF
)"
```

---

## Testing (to be filled in)

Document how to run tests once they exist:

```bash
# Example — replace with actual commands
npm test          # Run all tests
npm run test:unit # Run unit tests only
npm run lint      # Run linter
```

---

## Environment Setup (to be filled in)

Document environment variables, `.env.example`, and local setup steps here once defined.

---

## Key Conventions (to be filled in)

As the codebase grows, record decisions here:

- **Language/runtime:** TBD
- **Code style / linter:** TBD
- **Formatter:** TBD
- **Package manager:** TBD
- **Database:** TBD
- **API style:** TBD

---

## Updating This File

Keep CLAUDE.md current. Update it when:

- New top-level directories or major modules are added.
- Build, test, or lint commands change.
- New conventions are adopted.
- Environment variables or external dependencies are introduced.

This file is the primary source of truth for any AI assistant working in this repo.
