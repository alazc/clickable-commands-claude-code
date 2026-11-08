# clickable-commands for Claude Code

Clickable shell commands and slash commands for Claude Code, the terminal coding tool from Anthropic.

clickable-commands is a Claude Code plugin (a mod).

If Claude gives you a command in a reply, the mod shows a button for it above the prompt box. You press the button, and the command goes into the prompt box. You do not copy and paste.

A button does not run the command. You read the command in the prompt box, and you press Enter to run it.

```text
  Claude's reply
  ── bash
    start "" ./videos/demo.mp4
  ── text
    /plugin list

  commands from the last reply · press one to put it in the prompt   [ x ]
  ⏎ /sh start "" ./videos/demo.mp4
  ⏎ /plugin list
 ──────────────────────────────────────────────────────────────────────────
 > /sh start "" ./videos/demo.mp4
```

## What it does

After each reply from Claude, the mod reads the reply's fenced code blocks. It makes one button for each command that it finds. It shows at most five buttons, then a "+N more" line.

| Block in the reply | What the button puts in the prompt box |
| --- | --- |
| `bash`, `sh`, `shell`, `zsh`, `cmd`, `bat` | `/sh ` and then the whole block |
| `powershell`, `pwsh`, `ps1`, `ps` | `/ps ` and then the whole block |
| `console`, `terminal`, `shell-session` | `/sh ` and then only the lines that start with `$`, `>` or `PS ...>`, without the prompt |
| Any block in which every line is a slash command, for example `/plugin list` | Each line as written, one button for each line |

The mod adds two slash commands, `/sh` and `/ps`. When you press Enter on `/sh <command>`, the mod gives the command to the Bash tool of your session. `/ps` uses the PowerShell tool, if your session has one. Otherwise `/ps` also uses the Bash tool. The tool call goes through your normal permission rules. If a rule does not allow the command, Claude Code asks you first. The output shows under the command.

A slash command from a button is the same as a slash command that you type.

The mod does not use the `!` prefix. Claude Code reads `!` as shell mode only when you type it as the first key. Text that a mod puts in the prompt box goes to Claude as a message.

The button replaces what is in the prompt box. The `[ x ]` button hides the band until the next reply.

The mod shows the band in the terminal and in the desktop app. It works with or without other mods that change how replies look, for example prismantis. It does not change how replies are drawn.

## Install

Type this line at the prompt of a Claude Code terminal session:

```text
/plugin install clickable-commands --marketplace alazc/clickable-commands-claude-code
```

When Claude Code asks `Add marketplace?`, answer `y`. Then pick a scope. The user scope loads the mod in all your sessions.

To install from a shell instead:

```bash
claude plugin install clickable-commands --marketplace alazc/clickable-commands-claude-code
```

In the desktop app, where `/plugin` does not run, click + next to the prompt box. Click Plugins, then Add marketplace, and type `alazc/clickable-commands-claude-code`. Then click Add plugin.

## Use

1. Ask Claude for a command, for example "give me a command to list the files in this folder".
2. Find the band above the prompt box. Click a row. If your terminal does not send clicks, press ctrl+x tab to move to the band, and then press Enter on a row.
3. Read the command in the prompt box. If it is correct, press Enter to run it.

## Update and remove

To get a new version:

```bash
claude plugin marketplace update clickable-commands-claude-code
claude plugin update clickable-commands@clickable-commands-claude-code
```

Restart Claude Code after an update.

To remove the mod:

```bash
claude plugin uninstall clickable-commands@clickable-commands-claude-code
```

## Develop

The mod is a Claude Code hooks module in TypeScript. It has no dependencies.

| File | Content |
| --- | --- |
| `hooks/register.tsx` | The hooks. At the end of each turn, they read the reply. They also draw the band and fill the prompt box. |
| `hooks/extract.ts` | Finds the commands in a reply's markdown |
| `hooks/extract.test.tsx` | Tests for the extractor and the band |
| `types/index.d.ts` | The type contract for the mod's session state |

Run the checks from the repository folder:

```bash
claude plugin validate .
claude plugin test .
```

To load your copy in a session while you work on it:

```bash
claude --plugin-dir .
```

## License

MIT. See [LICENSE](LICENSE).
