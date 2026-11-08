import { expect, test } from 'claude-code/testing'

import { promptTexts } from './extract'

const F = '```'

test('shell blocks fill /sh, PowerShell blocks fill /ps, other languages none', async () => {
  const md = [
    'Run this:',
    `${F}bash`, 'start "" ./videos/demo.mp4', F,
    `${F}python`, 'print(1)', F,
    `${F}powershell`, 'Get-ChildItem', F,
    `${F}bash`, 'start "" ./videos/demo.mp4', F,
  ].join('\n')
  expect(promptTexts(md)).toEqual(['/sh start "" ./videos/demo.mp4', '/ps Get-ChildItem'])
})

test('console blocks keep only prompted lines', async () => {
  const md = [`${F}console`, '$ npm test', 'PASS all', 'PS C:\\x> dir', F].join('\n')
  expect(promptTexts(md)).toEqual(['/sh npm test\ndir'])
})

test('tilde fences and longer fences work', async () => {
  const md = ['~~~sh', 'ls -la', '~~~', '````bash', 'echo a', F, 'echo b', '````'].join('\n')
  expect(promptTexts(md)).toEqual(['/sh ls -la', `/sh echo a\n${F}\necho b`])
})

test('slash commands are found as written, paths are not', async () => {
  const md = [
    `${F}text`, '/plugin install clickable-commands --marketplace alazc/clickable-commands-claude-code', F,
    F, '/prismantis:setup', '', '/clear', F,
    `${F}text`, '/usr/bin/env node', F,
    `${F}text`, '/clear', 'then type hello', F,
  ].join('\n')
  expect(promptTexts(md)).toEqual([
    '/plugin install clickable-commands --marketplace alazc/clickable-commands-claude-code',
    '/prismantis:setup',
    '/clear',
  ])
})

const BAND = {
  plugin: 'clickable-commands',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 80, scroll: { offset: 0, bodyRows: 20 } },
} as const

test('the band lists commands and a press fills the prompt', async ($, on) => {
  const filled: string[] = []
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.messages', () => ({
    value: [
      { role: 'user', text: 'how do I play it?', toolUses: [] },
      { role: 'assistant', text: `Use:\n${F}bash\nstart "" ./a.mp4\n${F}\nor\n${F}text\n/plugin list\n${F}`, toolUses: [] },
    ],
  }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  // Stands for the engine's own band once the mod passes.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)

  expect((await ui.find({ type: 'Button', key: 'cmd0' } as never))?.text).toContain('/sh start "" ./a.mp4')
  expect((await ui.find({ type: 'Button', key: 'cmd1' } as never))?.text).toContain('/plugin list')
  await ui.press({ key: 'cmd0' })
  await ui.press({ key: 'cmd1' })
  expect(filled).toEqual(['/sh start "" ./a.mp4', '/plugin list'])

  await ui.press({ key: 'hide' })
  expect(await ui.find({ type: 'Button', key: 'cmd0' } as never)).toBe(undefined)
  await ui.unmount()
})

test('/sh runs the command with the Bash tool and shows the output', async ($, on) => {
  const calls: unknown[] = []
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.messages', () => ({ value: [] }))
  on('tool.list', () => ({ value: [{ name: 'Bash' }, { name: 'PowerShell' }] as never }))
  on('tool.call', (_, e) => {
    calls.push(e)
    return { result: {}, text: 'hello' }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const sh = await $.command.run({ command: 'sh', args: 'echo hello' } as never)
  expect(JSON.stringify(sh)).toContain('hello')
  const ps = await $.command.run({ command: 'ps', args: 'Get-Date' } as never)
  expect(JSON.stringify(ps)).toContain('hello')
  expect(calls.map(c => [(c as { tool: string }).tool, (c as { command: string }).command])).toEqual([
    ['Bash', 'echo hello'],
    ['PowerShell', 'Get-Date'],
  ])
})

test('/sh reports a refused call and does not claim it ran', async ($, on) => {
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.messages', () => ({ value: [] }))
  on('tool.list', () => ({ value: [{ name: 'Bash' }] as never }))
  on('tool.call', () => ({ deny: 'The user said no' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const out = await $.command.run({ command: 'sh', args: 'rm -rf build' } as never)
  expect(JSON.stringify(out)).toContain('Not run: The user said no')
})
