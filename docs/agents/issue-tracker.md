# Issue tracker: GitHub

Issues and specs for this repo live at [GitHub Issues](https://github.com/s-arbu/chatalume-extension/issues). Use the `gh` CLI for tracker operations once the repository is available on GitHub.

## Conventions

- **Create an issue**: `gh issue create --repo s-arbu/chatalume-extension --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --repo s-arbu/chatalume-extension --comments`
- **List issues**: `gh issue list --repo s-arbu/chatalume-extension --state open`
- **Comment on an issue**: `gh issue comment <number> --repo s-arbu/chatalume-extension --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --repo s-arbu/chatalume-extension --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo s-arbu/chatalume-extension --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.**

When a skill says to publish to the issue tracker, create a GitHub issue. The repository URL is `https://github.com/s-arbu/chatalume-extension`.
