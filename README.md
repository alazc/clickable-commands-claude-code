# shell-to-prompt

shell-to-prompt is a Claude Code mod. After each reply from Claude, it shows a band above the prompt box. The band has one button for each shell command in the reply's fenced code blocks.

When you press a button, the prompt box gets `! <command>`. Nothing runs until you press Enter. Enter then runs the command in the session as a shell command.

The mod reads blocks tagged `bash`, `sh`, `shell`, `zsh`, `powershell`, `pwsh`, `ps1`, `ps`, `cmd` and `bat`. For `console` and `terminal` blocks, it keeps only the lines that start with a prompt (`$`, `>` or `PS ...>`). The `[ x ]` button hides the band until the next reply.

The mod works with or without the prismantis mod. It does not change how replies are drawn.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install shell-to-prompt --marketplace alazc/shell-to-prompt
```

From a shell:

```
claude plugin install shell-to-prompt --marketplace alazc/shell-to-prompt
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `alazc/shell-to-prompt`, then Add plugin.

When Claude Code asks `Add marketplace?`, answer `y`. Then pick a scope.

This repository is private. You can install the mod only if you can read the repository on GitHub and your computer has a git credential for github.com (an SSH key, or `gh auth login` then `gh auth setup-git`).

## Use

1. Ask Claude for a command, for example "give me a command to open a file".
2. Find the band above the prompt box. Click a row, or press ctrl+x tab and then Enter.
3. Read the command in the prompt box. If it is correct, press Enter to run it.

## Develop

```
claude plugin validate .
claude plugin test .
```
