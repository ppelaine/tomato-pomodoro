import { useState, useEffect, useRef } from 'react'
import { FileItem } from '@shared/types'

interface FileListProps {
  files: FileItem[]
  loading: boolean
  error: string | null
  selectedFile: FileItem | null
  viewMode: 'list' | 'icons' | 'details'
  onFileClick: (file: FileItem) => void
  onFileDoubleClick: (file: FileItem) => void
  onDelete: (targetPath: string) => void
  onRename: (oldPath: string, newName: string) => void
  onCopy: (src: string, dest: string) => void
  onMove: (src: string, dest: string) => void
  onCreateFolder: (folderName: string) => void
  currentPath: string
}

interface ContextMenuState {
  show: boolean
  x: number
  y: number
  targetFile: FileItem | null
}

export function FileList({
  files,
  loading,
  error,
  selectedFile,
  viewMode,
  onFileClick,
  onFileDoubleClick,
  onDelete,
  onRename,
  onCopy,
  onMove,
  onCreateFolder,
  currentPath
}: FileListProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    targetFile: null
  })
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null)
  const [newName, setNewName] = useState('')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingFile && renameInputRef.current) {
      renameInputRef.current.focus()
      const fileName = renamingFile.name
      const lastDotIndex = fileName.lastIndexOf('.')
      if (lastDotIndex > 0 && !renamingFile.isDirectory) {
        renameInputRef.current.setSelectionRange(0, lastDotIndex)
      } else {
        renameInputRef.current.select()
      }
    }
  }, [renamingFile])

  useEffect(() => {
    if (showNewFolderDialog && newFolderInputRef.current) {
      newFolderInputRef.current.focus()
    }
  }, [showNewFolderDialog])

  useEffect(() => {
    const handleClick = () => {
      setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
    }
    
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, file: FileItem | null = null) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      targetFile: file
    })
  }

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    handleContextMenu(e, null)
  }

  const handleRename = () => {
    if (contextMenu.targetFile) {
      setRenamingFile(contextMenu.targetFile)
      setNewName(contextMenu.targetFile.name)
    }
    setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (renamingFile && newName.trim() && newName !== renamingFile.name) {
      onRename(renamingFile.path, newName.trim())
    }
    setRenamingFile(null)
    setNewName('')
  }

  const handleRenameCancel = () => {
    setRenamingFile(null)
    setNewName('')
  }

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
      setNewFolderName('')
      setShowNewFolderDialog(false)
    }
  }

  const handleCreateFolderCancel = () => {
    setNewFolderName('')
    setShowNewFolderDialog(false)
  }

  const handleNewFolder = () => {
    setShowNewFolderDialog(true)
    setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
  }

  const handleDelete = () => {
    if (contextMenu.targetFile) {
      if (confirm(`确定要删除 "${contextMenu.targetFile.name}" 吗？`)) {
        onDelete(contextMenu.targetFile.path)
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
  }

  const handleOpen = async () => {
    if (contextMenu.targetFile) {
      if (contextMenu.targetFile.isDirectory) {
        onFileDoubleClick(contextMenu.targetFile)
      } else {
        await window.electronAPI.file.open(contextMenu.targetFile.path)
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
  }

  const handleOpenInNewWindow = async () => {
    if (contextMenu.targetFile) {
      await window.electronAPI.shell.openPath(contextMenu.targetFile.path)
    }
    setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowNewFolderDialog(false)
      setRenamingFile(null)
      setContextMenu({ show: false, x: 0, y: 0, targetFile: null })
    }
    if (e.key === 'F2' && selectedFile) {
      setRenamingFile(selectedFile)
      setNewName(selectedFile.name)
    }
    if (e.key === 'Delete' && selectedFile) {
      if (confirm(`确定要删除 "${selectedFile.name}" 吗？`)) {
        onDelete(selectedFile.path)
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (file: FileItem): string => {
    if (file.isDirectory) return '📁'
    
    const ext = file.type.toLowerCase()
    const iconMap: Record<string, string> = {
      '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️', 
      '.bmp': '🖼️', '.svg': '🖼️', '.webp': '🖼️',
      '.mp3': '🎵', '.wav': '🎵', '.ogg': '🎵', '.flac': '🎵',
      '.mp4': '🎬', '.avi': '🎬', '.mkv': '🎬', '.mov': '🎬', '.wmv': '🎬',
      '.pdf': '📄',
      '.doc': '📝', '.docx': '📝',
      '.xls': '📊', '.xlsx': '📊',
      '.ppt': '📽️', '.pptx': '📽️',
      '.txt': '📃', '.md': '📃',
      '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦', '.gz': '📦',
      '.html': '🌐', '.htm': '🌐',
      '.css': '🎨',
      '.js': '⚡', '.ts': '🔷', '.tsx': '🔷', '.jsx': '⚡',
      '.json': '📋', '.xml': '📋',
      '.py': '🐍',
      '.java': '☕',
      '.c': '⚙️', '.cpp': '⚙️', '.h': '⚙️',
      '.exe': '⚡',
      '.dll': '⚙️'
    }
    
    return iconMap[ext] || '📄'
  }

  if (loading) {
    return (
      <div className="file-list-container flex items-center justify-center">
        <div className="text-gray-500 text-sm">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="file-list-container flex items-center justify-center">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div 
      className="file-list-container" 
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onContextMenu={handleBackgroundContextMenu}
    >
      {files.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          此文件夹为空
        </div>
      ) : (
        viewMode === 'list' ? (
          <div className="flex flex-col">
            <div className="file-header">
              <span className="file-header-name">名称</span>
              <span className="file-header-date">修改日期</span>
              <span className="file-header-size">大小</span>
            </div>
            {files.map((file) => (
              <div
                key={file.path}
                className={`file-item ${selectedFile?.path === file.path ? 'selected' : ''} ${file.isDirectory ? 'directory' : ''}`}
                onClick={() => onFileClick(file)}
                onDoubleClick={() => onFileDoubleClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <span className="file-icon">{getFileIcon(file)}</span>
                {renamingFile?.path === file.path ? (
                  <form onSubmit={handleRenameSubmit} className="flex-1">
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={handleRenameCancel}
                      onKeyDown={(e) => e.key === 'Escape' && handleRenameCancel()}
                      className="input-field"
                      autoFocus
                    />
                  </form>
                ) : (
                  <>
                    <span className="file-name flex-1">{file.name}</span>
                    <span className="file-date">{formatDate(file.modifiedTime)}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="file-grid">
            {files.map((file) => (
              <div
                key={file.path}
                className={`file-grid-item ${selectedFile?.path === file.path ? 'selected' : ''}`}
                onClick={() => onFileClick(file)}
                onDoubleClick={() => onFileDoubleClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <span className="file-grid-icon">{getFileIcon(file)}</span>
                {renamingFile?.path === file.path ? (
                  <form onSubmit={handleRenameSubmit} className="w-full">
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={handleRenameCancel}
                      onKeyDown={(e) => e.key === 'Escape' && handleRenameCancel()}
                      className="input-field text-center text-xs"
                      autoFocus
                    />
                  </form>
                ) : (
                  <span className="file-grid-name">{file.name}</span>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {contextMenu.show && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetFile ? (
            <>
              <div className="context-menu-item" onClick={handleOpen}>
                <span>📂</span>
                {contextMenu.targetFile.isDirectory ? '打开' : '打开方式'}
              </div>
              <div className="context-menu-item" onClick={handleOpenInNewWindow}>
                <span>🚀</span>
                在新窗口中打开
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item" onClick={handleRename}>
                <span>✏️</span>
                重命名
              </div>
              <div className="context-menu-item" onClick={handleDelete}>
                <span>🗑️</span>
                删除
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item text-gray-500">
                <span>⌨️</span>
                F2 重命名 · Del 删除
              </div>
            </>
          ) : (
            <>
              <div className="context-menu-item" onClick={handleNewFolder}>
                <span>📁</span>
                新建文件夹
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item text-gray-500">
                <span>💡</span>
                在此处右键打开菜单
              </div>
            </>
          )}
        </div>
      )}

      {showNewFolderDialog && (
        <div className="modal-overlay" onClick={handleCreateFolderCancel}>
          <div className="preset-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">新建文件夹</h3>
            <form onSubmit={handleCreateFolderSubmit}>
              <input
                ref={newFolderInputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入文件夹名称"
                className="input-field"
                onKeyDown={(e) => e.key === 'Escape' && handleCreateFolderCancel()}
                autoFocus
              />
              <div className="flex gap-2 mt-6 justify-end">
                <button
                  type="button"
                  onClick={handleCreateFolderCancel}
                  className="toolbar-btn"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="toolbar-btn primary"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
