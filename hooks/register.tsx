import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { promptTexts } from './extract'

const commands = atom({ plugin: 'clickable-commands', key: 'commands' } as const, [] as string[])
const isHidden = atom({ plugin: 'clickable-commands', key: 'isHidden' } as const, false)

const SHOWN = 5

const cut = (text: string, room: number): string =>
  text.length <= room ? text : `${text.slice(0, Math.max(1, room - 1))}…`

/** Commands from every assistant message since the person's last prompt. */
const latestCommands = async ($: EngineInterface): Promise<string[]> => {
  const messages = await $.session.messages()
  let start = 0
  messages.forEach((m, i) => {
    if (m.role === 'user' && m.text.trim() && !m.toolResults?.length) start = i + 1
  })
  const reply = messages
    .slice(start)
    .filter(m => m.role === 'assistant')
    .map(m => m.text)
    .join('\n\n')
  return promptTexts(reply)
}

const refresh = async ($: EngineInterface) => {
  const found = await latestCommands($).catch(() => [] as string[])
  await update($, commands, () => found)
  await update($, isHidden, () => false)
}

/** A fence one backtick longer than any run of backticks in `text`. */
const fenced = (text: string): string => {
  const longest = Math.max(2, ...(text.match(/`+/g) ?? []).map(run => run.length))
  const fence = '`'.repeat(longest + 1)
  return `${fence}text\n${text}\n${fence}`
}

/** Runs `command` with the session's own shell tool, permission check included. */
const runShell = async ($: EngineInterface, shell: 'sh' | 'ps', command: string): Promise<string> => {
  if (!command.trim()) return `Usage: /${shell} <command>`
  const tools = (await $.tool.list().catch(() => [])).map(tool => tool.name)
  const tool = shell === 'ps' && tools.includes('PowerShell') ? 'PowerShell' : 'Bash'
  const done = await $.tool
    .call({ tool, command, description: 'Run a command from a clickable-commands button' } as never)
    .catch((error: unknown) => ({ deny: String(error instanceof Error ? error.message : error) }))
  if ('deny' in done && done.deny !== undefined) return `Not run: ${done.deny}`
  const output = (done.text ?? '').trim()
  return fenced(output ? `$ ${command}
${output}` : `$ ${command}
(no output)`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command
      .register({ name: 'sh', description: 'Run a shell command in this session (clickable-commands)', argumentHint: '<command>' })
      .catch(() => undefined)
    await $.command
      .register({ name: 'ps', description: 'Run a PowerShell command in this session (clickable-commands)', argumentHint: '<command>' })
      .catch(() => undefined)
    await refresh($)
    return started
  })

  on('command.run', { command: 'sh' }, async ($, e) => ({ text: await runShell($, 'sh', e.args) }))
  on('command.run', { command: 'ps' }, async ($, e) => ({ text: await runShell($, 'ps', e.args) }))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, commands)
    if (e.props.hasSurvey || list.length === 0 || (await read($, isHidden))) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const room = Math.max(12, e.props.bodyColumns - 14)

    const fill = async (text: string) => {
      const done = await $.prompt.fill({ text, mode: 'replace' })
      if (!done.isFilled) {
        $.ui.toast(done.refusal === 'dialog' ? 'Close the dialog first, then press again.' : 'The prompt box did not take the command.')
      }
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between">
          <Text dimColor>commands from the last reply · press one to put it in the prompt</Text>
          <Button key="hide" label="x" onPress={() => update($, isHidden, () => true)} />
        </Box>
        {list.slice(0, SHOWN).map((command, i) => {
          const [first = '', ...rest] = command.split('\n')
          return (
            <Button key={`cmd${i}`} plain onPress={() => fill(command)}>
              {`⏎ ${cut(first, room + 2)}`}
              {rest.length ? <Text dimColor>{` (+${rest.length} lines)`}</Text> : ''}
            </Button>
          )
        })}
        {list.length > SHOWN ? <Text dimColor>{`+${list.length - SHOWN} more`}</Text> : null}
      </Box>
    )
  })
}
