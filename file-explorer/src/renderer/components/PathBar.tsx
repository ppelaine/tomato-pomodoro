import { useState } from 'react'

interface PathBarProps {
  path: string
  canGoBack: boolean
  canGoForward: boolean
  onNavigate: (path: string) => void
  onBack: () => void
  onForward: () => void
  onUp: () => void
  onRefresh: () => void
  panelLabel: string
}

export function PathBar({
  path,
  canGoBack,
  canGoForward,
  onNavigate,
  onBack,
  onForward,
  onUp,
  onRefresh,
  panelLabel
}: PathBarProps) {
  const [inputValue, setInputValue] = useState(path)
  const [isEditing, setIsEditing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNavigate(inputValue)
    setIsEditing(false)
  }

  const handleBlur = () => {
    setInputValue(path)
    setIsEditing(false)
  }

  const handleFocus = () => {
    setIsEditing(true)
  }

  return (
    <div className="path-bar">
      <span className="text-sm font-semibold text-primary mr-2 whitespace-nowrap">
        {panelLabel}
      </span>
      
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed"
        title="后退"
      >
        ←
      </button>
      
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className="toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed"
        title="前进"
      >
        →
      </button>
      
      <button
        onClick={onUp}
        className="toolbar-btn"
        title="上一级"
      >
        ↑
      </button>
      
      <button
        onClick={onRefresh}
        className="toolbar-btn"
        title="刷新"
      >
        ⟳
      </button>
      
      <form onSubmit={handleSubmit} className="flex-1">
        <input
          type="text"
          value={isEditing ? inputValue : path}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="path-input"
          placeholder="输入路径..."
        />
      </form>
    </div>
  )
}
