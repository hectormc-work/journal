---
paths:
  - ".claude/**"
  - "**/CLAUDE.md"
---

Where new knowledge about this codebase goes: `CLAUDE.md`, a rule, or a skill. General markdown style: `markdown-writing.md`, not repeated here.

## The three kinds of docs

Each one has a different job.

- **CLAUDE.md**: high-level orientation for a junior developer
  - What exists, what it's for, how workspaces interact
  - Descriptive, not prescriptive
  - "What files exist here and what they contain" belongs here, even about one narrow package, since it's orientation, not a code-writing rule
- **Rules** (`.claude/rules/*.md`): auto-attached by path glob (frontmatter `paths:`)
  - Prescriptive: how to write code touching those specific paths
  - If a domain has multiple distinct sub-concerns (say, a tool with both a binary and an npm package half), split into separate named files per concern, not one combined file, even if the concerns happen to share file types
- **Skills** (`.claude/skills/<name>/SKILL.md`): a procedure, what to do in order and why
  - Reach for a skill instead of a rule when a workflow is awkward to scope by path glob
    - Spans multiple file types
    - Invoked from the root rather than triggered by editing one kind of file (example: migrations, `yarn db:new` runs from anywhere, then a generated `.sql` file gets edited, then more root commands)
  - "How to do it" lives in a rule if it's specific to one generic file type, in the skill itself if specialized to that one procedure

## Conventions

- Naming: `<namespace>-<action>`
- Stub files are fine: name plus a one-line description of intended scope, no real content yet, fill in once there's something concrete to say

## Careful

Where things belong, and when to stop and ask.

- Workspace-specific details go in `.claude/`, not personal memory
  - Feature documentation, or anything generalizable to this repo: `.claude/` or `CLAUDE.md`
  - Actually specific to working with this user across projects: global memory
- Should what you're writing be a docstring instead?
- When scope is genuinely ambiguous (which file, rule vs. skill vs. CLAUDE.md), ask rather than guess. A wrong guess here is a rewrite, not just a missed detail.
