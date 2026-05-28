import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import log from 'electron-log'

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedTime: string
  type: string
}

interface PanelConfig {
  id: string
  path: string
  history: string[]
  historyIndex: number
  viewMode: 'list' | 'icons' | 'details'
}

interface AppConfig {
  panels: PanelConfig[]
  presets: { name: string; panels: PanelConfig[] }[]
  windowSize: { width: number; height: number }
}

let currentConfig: AppConfig | null = null

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

function getDefaultConfig(): AppConfig {
  const desktopPath = app.getPath('desktop')
  
  return {
    panels: [
      {
        id: 'panel-1',
        path: desktopPath,
        history: [desktopPath],
        historyIndex: 0,
        viewMode: 'list'
      },
      {
        id: 'panel-2',
        path: desktopPath,
        history: [desktopPath],
        historyIndex: 0,
        viewMode: 'list'
      },
      {
        id: 'panel-3',
        path: 'C:\\',
        history: ['C:\\'],
        historyIndex: 0,
        viewMode: 'list'
      },
      {
        id: 'panel-4',
        path: 'C:\\',
        history: ['C:\\'],
        historyIndex: 0,
        viewMode: 'list'
      }
    ],
    presets: [],
    windowSize: {
      width: 1400,
      height: 900
    }
  }
}

export function setupConfigIPC() {
  ipcMain.handle('config:load', async () => {
    try {
      const configPath = getConfigPath()
      
      if (fs.existsSync(configPath)) {
        const data = await fs.promises.readFile(configPath, 'utf-8')
        currentConfig = JSON.parse(data)
        log.info('配置文件加载成功')
        return currentConfig
      } else {
        currentConfig = getDefaultConfig()
        log.info('使用默认配置')
        return currentConfig
      }
    } catch (error) {
      log.error('加载配置文件失败:', error)
      currentConfig = getDefaultConfig()
      return currentConfig
    }
  })

  ipcMain.handle('config:save', async (_, config: AppConfig) => {
    try {
      const configPath = getConfigPath()
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
      currentConfig = config
      log.info('配置文件保存成功')
    } catch (error) {
      log.error('保存配置文件失败:', error)
      throw error
    }
  })

  ipcMain.handle('config:loadPreset', async (_, presetName: string) => {
    try {
      if (!currentConfig) {
        await loadConfig()
      }
      
      const preset = currentConfig!.presets.find(p => p.name === presetName)
      return preset ? preset.panels : null
    } catch (error) {
      log.error('加载预设失败:', error)
      throw error
    }
  })

  ipcMain.handle('config:savePreset', async (_, presetName: string, panels: PanelConfig[]) => {
    try {
      if (!currentConfig) {
        await loadConfig()
      }
      
      const existingIndex = currentConfig!.presets.findIndex(p => p.name === presetName)
      
      if (existingIndex >= 0) {
        currentConfig!.presets[existingIndex].panels = panels
      } else {
        currentConfig!.presets.push({ name: presetName, panels })
      }
      
      await saveConfig()
      log.info(`预设保存成功: ${presetName}`)
    } catch (error) {
      log.error('保存预设失败:', error)
      throw error
    }
  })

  ipcMain.handle('config:getPresets', async () => {
    try {
      if (!currentConfig) {
        await loadConfig()
      }
      
      return currentConfig!.presets.map(p => p.name)
    } catch (error) {
      log.error('获取预设列表失败:', error)
      throw error
    }
  })
}

async function loadConfig(): Promise<void> {
  try {
    const configPath = getConfigPath()
    
    if (fs.existsSync(configPath)) {
      const data = await fs.promises.readFile(configPath, 'utf-8')
      currentConfig = JSON.parse(data)
    } else {
      currentConfig = getDefaultConfig()
    }
  } catch (error) {
    log.error('加载配置失败:', error)
    currentConfig = getDefaultConfig()
  }
}

export async function saveConfig(): Promise<void> {
  try {
    if (currentConfig) {
      const configPath = getConfigPath()
      await fs.promises.writeFile(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8')
      log.info('配置已保存')
    }
  } catch (error) {
    log.error('保存配置失败:', error)
  }
}
