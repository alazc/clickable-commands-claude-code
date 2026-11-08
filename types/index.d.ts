declare module 'claude-code' {
  interface PluginState {
    'shell-to-prompt': { commands: string[]; isHidden: boolean }
  }
}
