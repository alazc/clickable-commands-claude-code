import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { shellCommands } from './extract'

const commands = atom({ plugin: 'shell-to-prompt', key: 'commands' } as const, [] as string[])
const isHidden = atom({ plugin: 'shell-to-prompt', key: 'isHidden' } as const, false)

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
  return shellCommands(reply)
}

const refresh = async ($: EngineInterface) => {
  const found = await latestCommands($).catch(() => [] as string[])
  await update($, commands, () => found)
  await update($, isHidden, () => false)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await refresh($)
    return started
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, commands)
    if (e.props.hasSurvey || list.length === 0 || (await read($, isHidden))) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const room = Math.max(12, e.props.bodyColumns - 14)

    const fill = async (command: string) => {
      const done = await $.prompt.fill({ text: `! ${command}`, mode: 'replace' })
      if (!done.isFilled) {
        $.ui.toast(done.refusal === 'dialog' ? 'Close the dialog first, then press again.' : 'The prompt box did not take the command.')
      }
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between">
          <Text dimColor>shell commands from the last reply · press one to put it in the prompt</Text>
          <Button key="hide" label="x" onPress={() => update($, isHidden, () => true)} />
        </Box>
        {list.slice(0, SHOWN).map((command, i) => {
          const [first = '', ...rest] = command.split('\n')
          return (
            <Button key={`cmd${i}`} plain onPress={() => fill(command)}>
              {`⏎ ${cut(first, room)}`}
              {rest.length ? <Text dimColor>{` (+${rest.length} lines)`}</Text> : ''}
            </Button>
          )
        })}
        {list.length > SHOWN ? <Text dimColor>{`+${list.length - SHOWN} more`}</Text> : null}
      </Box>
    )
  })
}
