const SHELLS = new Set(['bash', 'sh', 'shell', 'zsh', 'cmd', 'bat'])
const POWERSHELLS = new Set(['powershell', 'pwsh', 'ps1', 'ps'])
const SESSIONS = new Set(['console', 'terminal', 'shell-session'])
const PROMPT = /^(?:PS[^>]*>|\$|>)\s?/
const SLASH = /^\/[a-z][\w:-]*(\s|$)/i

const commandOf = (lang: string, lines: string[]): string => {
  if (!SESSIONS.has(lang)) return lines.join('\n').trim()
  return lines
    .filter(line => PROMPT.test(line))
    .map(line => line.replace(PROMPT, ''))
    .join('\n')
    .trim()
}

/** Slash commands in a block where every non-empty line is one, else none. */
const slashOf = (lines: string[]): string[] => {
  const kept = lines.map(line => line.trim()).filter(Boolean)
  return kept.length && kept.every(line => SLASH.test(line)) ? kept : []
}

/**
 * What each fenced block in a markdown reply would put in the prompt box, in
 * order, each once: `/sh <command>` for a shell block, `/ps <command>` for a
 * PowerShell block, the line as written for a slash command.
 */
export const promptTexts = (markdown: string): string[] => {
  const found: string[] = []
  const add = (text: string) => {
    if (text && !found.includes(text)) found.push(text)
  }
  let fence: { char: string; size: number; lang: string; lines: string[] } | undefined

  for (const line of markdown.split(/\r?\n/)) {
    const open = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/.exec(line)

    if (!fence) {
      if (open) fence = { char: open[1]![0]!, size: open[1]!.length, lang: open[2]!.toLowerCase(), lines: [] }
      continue
    }

    const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line)
    if (close && close[1]![0] === fence.char && close[1]!.length >= fence.size) {
      const slash = slashOf(fence.lines)
      if (slash.length) slash.forEach(add)
      else if (SHELLS.has(fence.lang) || SESSIONS.has(fence.lang) || POWERSHELLS.has(fence.lang)) {
        const command = commandOf(fence.lang, fence.lines)
        if (command) add(`/${POWERSHELLS.has(fence.lang) ? 'ps' : 'sh'} ${command}`)
      }
      fence = undefined
      continue
    }

    fence.lines.push(line)
  }

  return found
}
