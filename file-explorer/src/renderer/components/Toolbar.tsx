import { useState, useEffect } from 'react'

interface ToolbarProps {
  onSavePreset: (presetName: string) => void
  onLoadPreset: (presetName: string) => void
}

export function Toolbar({ onSavePreset, onLoadPreset }: ToolbarProps) {
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<string[]>([])
  const [showLoadModal, setShowLoadModal] = useState(false)

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      const presetList = await window.electronAPI.config.getPresets()
      setPresets(presetList)
    } catch (err) {
      console.error('加载预设列表失败:', err)
    }
  }

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault()
    if (presetName.trim()) {
      onSavePreset(presetName.trim())
      setPresetName('')
      setShowPresetModal(false)
      loadPresets()
    }
  }

  const handleLoadPreset = (name: string) => {
    onLoadPreset(name)
    setShowLoadModal(false)
  }

  const handleCancelSave = () => {
    setPresetName('')
    setShowPresetModal(false)
  }

  return (
    <>
      <div className="toolbar">
        <button
          onClick={() => setShowPresetModal(true)}
          className="toolbar-btn bg-primary text-white hover:bg-primary-dark"
        >
          保存预设
        </button>
        <button
          onClick={() => {
            loadPresets()
            setShowLoadModal(true)
          }}
          className="toolbar-btn"
        >
          加载预设
        </button>
      </div>

      {showPresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="preset-modal">
            <h3 className="text-lg font-semibold mb-4">保存预设</h3>
            <form onSubmit={handleSavePreset}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预设名称
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="输入预设名称"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="button"
                  onClick={handleCancelSave}
                  className="toolbar-btn"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="toolbar-btn bg-primary text-white hover:bg-primary-dark"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="preset-modal">
            <h3 className="text-lg font-semibold mb-4">加载预设</h3>
            {presets.length === 0 ? (
              <p className="text-gray-500 mb-4">暂无保存的预设</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {presets.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleLoadPreset(name)}
                    className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setShowLoadModal(false)}
                className="toolbar-btn"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
