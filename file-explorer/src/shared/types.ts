export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedTime: string
  type: string
}

export interface PanelConfig {
  id: string
  path: string
  history: string[]
  historyIndex: number
  viewMode: 'list' | 'icons' | 'details'
}

export interface AppConfig {
  panels: PanelConfig[]
  presets: { name: string; panels: PanelConfig[] }[]
  windowSize: { width: number; height: number }
}
