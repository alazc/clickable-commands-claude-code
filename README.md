# shell-to-prompt

shell-to-prompt is a mod for Claude Code, the terminal coding tool from Anthropic.

If Claude gives you a command in a reply, the mod shows a button for it above the prompt box. You press the button, and the command goes into the prompt box. You do not copy and paste.

A button does not run the command. You read the command in the prompt box, and you press Enter to run it.

```text
  Claude's reply
  ── bash
    start "" ./videos/demo.mp4
  ── text
    /plugin list

  commands from the last reply · press one to put it in the prompt   [ x ]
  ⏎ ! start "" ./videos/demo.mp4
  ⏎ /plugin list
 ──────────────────────────────────────────────────────────────────────────
 > ! start "" ./videos/demo.mp4
```

## What it does

After each reply from Claude, the mod reads the reply's fenced code blocks. It makes one button for each command that it finds. It shows at most five buttons, then a "+N more" line.

| Block in the reply | What the button puts in the prompt box |
| --- | --- |
| `bash`, `sh`, `shell`, `zsh`, `powershell`, `pwsh`, `ps1`, `ps`, `cmd`, `bat` | `! ` and then the whole block |
| `console`, `terminal`, `shell-session` | `! ` and then only the lines that start with `$`, `>` or `PS ...>`, without the prompt |
| Any block in which every line is a slash command, for example `/plugin list` | Each line as written, one button for each line |

In Claude Code, a prompt that starts with `!` runs as a shell command in your session. The output goes into the conversation. A slash command from a button is the same as a slash command that you type.

The button replaces what is in the prompt box. The `[ x ]` button hides the band until the next reply.

The mod shows the band in the terminal and in the desktop app. It works with or without other mods that change how replies look, for example prismantis. It does not change how replies are drawn.

## Install

Type this line at the prompt of a Claude Code terminal session:

```text
/plugin install shell-to-prompt --marketplace alazc/shell-to-prompt
```

When Claude Code asks `Add marketplace?`, answer `y`. Then pick a scope. The user scope loads the mod in all your sessions.

To install from a shell instead:

```bash
claude plugin install shell-to-prompt --marketplace alazc/shell-to-prompt
```

In the desktop app, where `/plugin` does not run, click + next to the prompt box. Click Plugins, then Add marketplace, and type `alazc/shell-to-prompt`. Then click Add plugin.

## Use

1. Ask Claude for a command, for example "give me a command to list the files in this folder".
2. Find the band above the prompt box. Click a row. If your terminal does not send clicks, press ctrl+x tab to move to the band, and then press Enter on a row.
3. Read the command in the prompt box. If it is correct, press Enter to run it.

## Update and remove

To get a new version:

```bash
claude plugin marketplace update shell-to-prompt
claude plugin update shell-to-prompt@shell-to-prompt
```

Restart Claude Code after an update.

To remove the mod:

```bash
claude plugin uninstall shell-to-prompt@shell-to-prompt
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
