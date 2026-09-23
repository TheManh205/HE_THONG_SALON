# Skill Agents Integration Guide

This file explains how to use the `.agents/skills` collection inside this repository and gives examples for `banner-design` and `ui-styling`.

## Overview
- Skills are stored under `.agents/skills/<skill-name>/` as documentation and configuration files.
- They are not code that runs directly; they are guidance files that VS Code Copilot/Agent features or other agent runners can consume.

## How to include and use skills in this project

1. Keep the `.agents/skills` folder in the repository root.
2. When using a local agent runner or Copilot agent extension that supports loading skills, point it at this path.
3. In VS Code, open the `Command Palette` and run the relevant copilot/agent commands to load or import skills (extension-specific).

## Example: `banner-design` usage

- Purpose: design banners for social media, ads, and website heroes.
- Files: `.agents/skills/banner-design/SKILL.md` contains usage instructions and prompts.

How to use locally:
1. Open `.agents/skills/banner-design/SKILL.md` and read the suggested prompts.
2. Copy a prompt into the Copilot Chat or your preferred agent prompt UI.
3. Follow the interactive steps the agent suggests to generate images, variants, or HTML mocks.

Example prompt to paste into Copilot Chat:
> "Design a 1200x628 Facebook cover for a salon opening with a warm gradient, headline 'Grand Opening', and CTA 'Book Now'. Provide HTML + Tailwind CSS output."

## Example: `ui-styling` usage

- Purpose: create design tokens, Tailwind variables, and component styling.
- Files: `.agents/skills/ui-styling/SKILL.md`.

How to use:
1. Read the SKILL.md for parameters and style options.
2. Ask the agent to generate `tailwind.config.js` updates or Tailwind-friendly CSS variables.

Example prompt:
> "Create a Tailwind color palette and spacing tokens for a modern salon brand. Output a `tailwind.config.js` snippet and CSS variables." 

## Reloading VS Code and validating
- After adding or updating skills, reload the VS Code window (`Developer: Reload Window`).
- Use the Copilot/Agent extension UI to import skills or point to the `.agents/skills` directory.

## Troubleshooting
- If the agent UI doesn't list new skills, confirm the extension supports local skill loading and check extension settings.
- Ensure SKILL.md files are valid markdown and include frontmatter if the extension requires it.

## Next steps I can do for you
- Add concrete prompt templates for each skill (banner-design, ui-styling, slides).
- Create a small script or VS Code task to open common SKILL.md files quickly.
- Demonstrate generating a banner HTML/Tailwind snippet using a sample prompt.

If you'd like, I can now add prompt templates and a quick VS Code task. Which option do you prefer?