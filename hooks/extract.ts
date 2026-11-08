const SHELLS = new Set(['bash', 'sh', 'shell', 'zsh', 'powershell', 'pwsh', 'ps1', 'ps', 'cmd', 'bat'])
const SESSIONS = new Set(['console', 'terminal', 'shell-session'])
const PROMPT = /^(?:PS[^>]*>|\$|>)\s?/

const commandOf = (lang: string, lines: string[]): string => {
  if (!SESSIONS.has(lang)) return lines.join('\n').trim()
  return lines
    .filter(line => PROMPT.test(line))
    .map(line => line.replace(PROMPT, ''))
    .join('\n')
    .trim()
}

/** The shell commands in a markdown reply's fenced blocks, in order, each once. */
export const shellCommands = (markdown: string): string[] => {
  const found: string[] = []
  let fence: { char: string; size: number; lang: string; lines: string[] } | undefined

  for (const line of markdown.split(/\r?\n/)) {
    const open = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/.exec(line)

    if (!fence) {
      if (open) fence = { char: open[1]![0]!, size: open[1]!.length, lang: open[2]!.toLowerCase(), lines: [] }
      continue
    }

    const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line)
    if (close && close[1]![0] === fence.char && close[1]!.length >= fence.size) {
      if (SHELLS.has(fence.lang) || SESSIONS.has(fence.lang)) {
        const command = commandOf(fence.lang, fence.lines)
        if (command && !found.includes(command)) found.push(command)
      }
      fence = undefined
      continue
    }

    fence.lines.push(line)
  }

  return found
}
