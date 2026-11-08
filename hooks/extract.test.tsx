import { expect, test } from 'claude-code/testing'

import { promptTexts } from './extract'

const F = '```'

test('shell blocks are found with !, other languages are not', async () => {
  const md = [
    'Run this:',
    `${F}bash`, 'start "" ./videos/demo.mp4', F,
    `${F}python`, 'print(1)', F,
    `${F}powershell`, 'Get-ChildItem', F,
    `${F}bash`, 'start "" ./videos/demo.mp4', F,
  ].join('\n')
  expect(promptTexts(md)).toEqual(['! start "" ./videos/demo.mp4', '! Get-ChildItem'])
})

test('console blocks keep only prompted lines', async () => {
  const md = [`${F}console`, '$ npm test', 'PASS all', 'PS C:\\x> dir', F].join('\n')
  expect(promptTexts(md)).toEqual(['! npm test\ndir'])
})

test('tilde fences and longer fences work', async () => {
  const md = ['~~~sh', 'ls -la', '~~~', '````bash', 'echo a', F, 'echo b', '````'].join('\n')
  expect(promptTexts(md)).toEqual(['! ls -la', `! echo a\n${F}\necho b`])
})

test('slash commands are found as written, paths are not', async () => {
  const md = [
    `${F}text`, '/plugin install shell-to-prompt --marketplace alazc/shell-to-prompt', F,
    F, '/prismantis:setup', '', '/clear', F,
    `${F}text`, '/usr/bin/env node', F,
    `${F}text`, '/clear', 'then type hello', F,
  ].join('\n')
  expect(promptTexts(md)).toEqual([
    '/plugin install shell-to-prompt --marketplace alazc/shell-to-prompt',
    '/prismantis:setup',
    '/clear',
  ])
})

const BAND = {
  plugin: 'shell-to-prompt',
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

  expect((await ui.find({ type: 'Button', key: 'cmd0' } as never))?.text).toContain('! start "" ./a.mp4')
  expect((await ui.find({ type: 'Button', key: 'cmd1' } as never))?.text).toContain('/plugin list')
  await ui.press({ key: 'cmd0' })
  await ui.press({ key: 'cmd1' })
  expect(filled).toEqual(['! start "" ./a.mp4', '/plugin list'])

  await ui.press({ key: 'hide' })
  expect(await ui.find({ type: 'Button', key: 'cmd0' } as never)).toBe(undefined)
  await ui.unmount()
})
