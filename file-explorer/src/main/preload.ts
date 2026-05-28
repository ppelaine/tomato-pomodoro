import { contextBridge, ipcRenderer } from 'electron'

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

const electronAPI = {
  file: {
    list: (dirPath: string): Promise<FileItem[]> => 
      ipcRenderer.invoke('file:list', dirPath),
    copy: (src: string, dest: string): Promise<void> =>
      ipcRenderer.invoke('file:copy', src, dest),
    move: (src: string, dest: string): Promise<void> =>
      ipcRenderer.invoke('file:move', src, dest),
    delete: (targetPath: string): Promise<void> =>
      ipcRenderer.invoke('file:delete', targetPath),
    rename: (oldPath: string, newName: string): Promise<void> =>
      ipcRenderer.invoke('file:rename', oldPath, newName),
    open: (targetPath: string): Promise<void> =>
      ipcRenderer.invoke('file:open', targetPath),
    createFolder: (parentPath: string, folderName: string): Promise<void> =>
      ipcRenderer.invoke('file:createFolder', parentPath, folderName)
  },
  config: {
    load: (): Promise<AppConfig> =>
      ipcRenderer.invoke('config:load'),
    save: (config: AppConfig): Promise<void> =>
      ipcRenderer.invoke('config:save', config),
    loadPreset: (presetName: string): Promise<PanelConfig[] | null> =>
      ipcRenderer.invoke('config:loadPreset', presetName),
    savePreset: (presetName: string, panels: PanelConfig[]): Promise<void> =>
      ipcRenderer.invoke('config:savePreset', presetName, panels),
    getPresets: (): Promise<string[]> =>
      ipcRenderer.invoke('config:getPresets')
  },
  shell: {
    openPath: (path: string): Promise<void> =>
      ipcRenderer.invoke('shell:openPath', path)
  },
  getDesktopPath: (): Promise<string> =>
    ipcRenderer.invoke('get:desktopPath')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
