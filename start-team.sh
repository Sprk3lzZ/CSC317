#!/bin/bash
cd "$(dirname "$0")"

cat <<'BANNER'
  ╔═══════════════════════════════════════╗
  ║         CapstoneMaker Agent Team             ║
  ║   orchestrator · backend · frontend   ║
  ╚═══════════════════════════════════════╝
BANNER

claude --dangerously-skip-permissions "Read CLAUDE.md for full project context. Then initialize the CapstoneMaker agent team as described:

1. You are the **orchestrator**. Your role is to decompose features into tasks and coordinate the team.
2. Spawn the following agents as visible team members (team_name: \"capstone_maker\"):
   - **backend** (sonnet) — implements Rust/Axum code
   - **frontend** (sonnet) — implements Next.js/React code

Confirm the team is ready, then wait for my instructions."
