import { useState, useEffect } from 'react'
import { PathBar } from './PathBar'
import { FileList } from './FileList'
import { PanelConfig, FileItem } from '@shared/types'

interface FilePanelProps {
  panel: PanelConfig
  panelIndex: number
  onUpdate: (updates: Partial<PanelConfig>) => void
}

export function FilePanel({ panel, panelIndex, onUpdate }: FilePanelProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

  useEffect(() => {
    loadDirectory(panel.path)
  }, [panel.path])

  const loadDirectory = async (path: string) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedFile(null)
      const items = await window.electronAPI.file.list(path)
      setFiles(items)
    } catch (err) {
      console.error('加载目录失败:', err)
      setError('无法访问此目录')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (path: string) => {
    const newHistory = [...panel.history.slice(0, panel.historyIndex + 1), path]
    onUpdate({
      path,
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  }

  const handleBack = () => {
    if (panel.historyIndex > 0) {
      const newIndex = panel.historyIndex - 1
      onUpdate({
        path: panel.history[newIndex],
        historyIndex: newIndex
      })
    }
  }

  const handleForward = () => {
    if (panel.historyIndex < panel.history.length - 1) {
      const newIndex = panel.historyIndex + 1
      onUpdate({
        path: panel.history[newIndex],
        historyIndex: newIndex
      })
    }
  }

  const handleUp = async () => {
    let parentPath: string
    if (panel.path.includes('\\')) {
      const parts = panel.path.split('\\')
      if (parts.length > 1) {
        if (parts[parts.length - 1] === '') {
          parentPath = parts.slice(0, -2).join('\\') + '\\'
        } else {
          parentPath = parts.slice(0, -1).join('\\')
        }
      } else {
        return
      }
    } else if (panel.path.includes('/')) {
      const parts = panel.path.split('/')
      if (parts.length > 1) {
        parentPath = parts.slice(0, -1).join('/')
      } else {
        return
      }
    } else {
      return
    }
    
    if (parentPath && parentPath !== panel.path) {
      handleNavigate(parentPath)
    }
  }

  const handleRefresh = () => {
    loadDirectory(panel.path)
  }

  const handleViewChange = (mode: 'list' | 'icons') => {
    onUpdate({ viewMode: mode })
  }

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file)
  }

  const handleFileDoubleClick = async (file: FileItem) => {
    if (file.isDirectory) {
      handleNavigate(file.path)
    } else {
      try {
        await window.electronAPI.file.open(file.path)
      } catch (err) {
        console.error('打开文件失败:', err)
      }
    }
  }

  const handleCopy = async (src: string, dest: string) => {
    try {
      await window.electronAPI.file.copy(src, dest)
      await handleRefresh()
    } catch (err) {
      console.error('复制失败:', err)
      alert('复制失败')
    }
  }

  const handleMove = async (src: string, dest: string) => {
    try {
      await window.electronAPI.file.move(src, dest)
      await handleRefresh()
    } catch (err) {
      console.error('移动失败:', err)
      alert('移动失败')
    }
  }

  const handleDelete = async (targetPath: string) => {
    try {
      await window.electronAPI.file.delete(targetPath)
      await handleRefresh()
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败')
    }
  }

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      await window.electronAPI.file.rename(oldPath, newName)
      await handleRefresh()
    } catch (err) {
      console.error('重命名失败:', err)
      alert('重命名失败')
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      await window.electronAPI.file.createFolder(panel.path, folderName)
      await handleRefresh()
    } catch (err) {
      console.error('创建文件夹失败:', err)
      alert('创建文件夹失败')
    }
  }

  const panelNames = ['左上', '右上', '左下', '右下']

  return (
    <div className="file-panel h-full">
      <div className="file-panel-header flex items-center justify-between">
        <span>📂 {panelNames[panelIndex]} - 面板 {panelIndex + 1}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewChange('list')}
            className={`px-2 py-1 text-xs rounded ${panel.viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="列表视图"
          >
            列表
          </button>
          <button
            onClick={() => handleViewChange('icons')}
            className={`px-2 py-1 text-xs rounded ${panel.viewMode === 'icons' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="图标视图"
          >
            图标
          </button>
        </div>
      </div>
      <PathBar
        path={panel.path}
        canGoBack={panel.historyIndex > 0}
        canGoForward={panel.historyIndex < panel.history.length - 1}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onUp={handleUp}
        onRefresh={handleRefresh}
        panelLabel={`面板 ${panelIndex + 1}`}
      />
      <FileList
        files={files}
        loading={loading}
        error={error}
        selectedFile={selectedFile}
        viewMode={panel.viewMode}
        onFileClick={handleFileClick}
        onFileDoubleClick={handleFileDoubleClick}
        onDelete={handleDelete}
        onRename={handleRename}
        onCopy={handleCopy}
        onMove={handleMove}
        onCreateFolder={handleCreateFolder}
        currentPath={panel.path}
      />
    </div>
  )
}
