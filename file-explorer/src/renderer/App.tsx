import { useState, useEffect } from 'react'
import { FilePanel } from './components/FilePanel'
import { Toolbar } from './components/Toolbar'
import { PanelConfig } from '@shared/types'

function App() {
  const [panels, setPanels] = useState<PanelConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const config = await window.electronAPI.config.load()
      
      // 确保始终有4个面板
      const ensuredPanels: PanelConfig[] = []
      const desktopPath = await window.electronAPI.getDesktopPath()
      
      for (let i = 0; i < 4; i++) {
        if (config.panels && config.panels[i]) {
          ensuredPanels.push(config.panels[i])
        } else {
          const defaultPath = i < 2 ? desktopPath : 'C:\\'
          ensuredPanels.push({
            id: `panel-${i + 1}`,
            path: defaultPath,
            history: [defaultPath],
            historyIndex: 0,
            viewMode: 'list'
          })
        }
      }
      
      setPanels(ensuredPanels)
      setError(null)
    } catch (err) {
      console.error('加载配置失败:', err)
      // 如果加载失败，使用默认4面板配置
      try {
        const desktopPath = await window.electronAPI.getDesktopPath()
        setPanels([
          { id: 'panel-1', path: desktopPath, history: [desktopPath], historyIndex: 0, viewMode: 'list' },
          { id: 'panel-2', path: desktopPath, history: [desktopPath], historyIndex: 0, viewMode: 'list' },
          { id: 'panel-3', path: 'C:\\', history: ['C:\\'], historyIndex: 0, viewMode: 'list' },
          { id: 'panel-4', path: 'C:\\', history: ['C:\\'], historyIndex: 0, viewMode: 'list' }
        ])
        setError('加载配置失败，使用默认配置')
      } catch {
        // 最后的降级方案
        const defaultPath1 = 'C:\\Users\\Public\\Desktop'
        const defaultPath2 = 'C:\\'
        setPanels([
          { id: 'panel-1', path: defaultPath1, history: [defaultPath1], historyIndex: 0, viewMode: 'list' },
          { id: 'panel-2', path: defaultPath1, history: [defaultPath1], historyIndex: 0, viewMode: 'list' },
          { id: 'panel-3', path: defaultPath2, history: [defaultPath2], historyIndex: 0, viewMode: 'list' },
          { id: 'panel-4', path: defaultPath2, history: [defaultPath2], historyIndex: 0, viewMode: 'list' }
        ])
        setError('加载配置失败，使用默认配置')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      const config = await window.electronAPI.config.load()
      config.panels = panels
      await window.electronAPI.config.save(config)
    } catch (err) {
      console.error('保存配置失败:', err)
    }
  }

  useEffect(() => {
    if (!loading && panels.length > 0) {
      saveConfig()
    }
  }, [panels])

  const updatePanel = (panelId: string, updates: Partial<PanelConfig>) => {
    setPanels(prevPanels =>
      prevPanels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      )
    )
  }

  const handleSavePreset = async (presetName: string) => {
    try {
      await window.electronAPI.config.savePreset(presetName, panels)
      alert(`预设 "${presetName}" 保存成功`)
    } catch (err) {
      console.error('保存预设失败:', err)
      alert('保存预设失败')
    }
  }

  const handleLoadPreset = async (presetName: string) => {
    try {
      const loadedPanels = await window.electronAPI.config.loadPreset(presetName)
      if (loadedPanels) {
        setPanels(loadedPanels)
        alert(`预设 "${presetName}" 加载成功`)
      }
    } catch (err) {
      console.error('加载预设失败:', err)
      alert('加载预设失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Toolbar
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
      />
      <div className="flex-1 p-2 overflow-hidden">
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {panels.map((panel, index) => (
            <div key={panel.id} className="h-full">
              <FilePanel
                panel={panel}
                panelIndex={index}
                onUpdate={(updates) => updatePanel(panel.id, updates)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
