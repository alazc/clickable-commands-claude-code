# Changelog

## 0.4.0

- Fix: a shell button did not run its command. The button put `! <command>` in the prompt box, and Claude Code sent that text to Claude as a message. Shell mode starts only when you type `!` as the first key.
- A shell button now puts `/sh <command>` in the prompt box. A PowerShell button puts `/ps <command>`. The mod runs these commands with the Bash or PowerShell tool of the session, through your permission rules, and shows the output.

## 0.3.0

- New name. The mod is now `clickable-commands`, and the repository is `alazc/clickable-commands-claude-code`. The old name was `shell-to-prompt`.
- If you installed `shell-to-prompt`, remove it with `claude plugin uninstall shell-to-prompt@shell-to-prompt`. Then install `clickable-commands`.

## 0.2.0

- Slash commands in fenced blocks get a button. A block in which every line is a slash command gives one button for each line. The button puts the line in the prompt box as written.
- Shell rows show the `!` that the button puts in the prompt box.

## 0.1.0

- First version. A band above the prompt box shows one button for each shell command in the latest reply. A press puts `! <command>` in the prompt box.
