# AI Agent Backup & Recovery Guide

This folder is a safe recovery area for AI-related project files.

## What is here
- `skills/` : reusable AI skill definitions for Copilot / local agent workflows
- `backup/` : backup copies of important project files

## Why this matters
When you ask an AI agent to modify code, it can sometimes change more than expected. This backup folder lets you restore the original file quickly.

## Recommended workflow
1. Before asking the agent to edit code, copy the target file into `.agent-backup/backup/...`
2. Review the AI patch
3. If the result is not desired, restore from backup
4. Re-run tests or app checks

## Important backup examples
- backend/app/services/ai_service.py
- backend/app/main.py
- frontend/src/App.jsx

## Restore example
If the agent changes the AI service, copy the file from:

`.agent-backup/backup/backend/app/services/ai_service.py`

back to:

`backend/app/services/ai_service.py`

## Use with Copilot skill
You can also load the skill under:

`.agents/skills/salon-ai-advisor/SKILL.md`

This helps an agent understand the salon AI workflow and business rules.
