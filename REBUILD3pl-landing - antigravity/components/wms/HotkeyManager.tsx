"use client"

import { useEffect, useCallback } from 'react'

interface HotkeyManagerProps {
  onToggleHeatmap: () => void
  onToggleLabels: () => void
  onTogglePickPath: () => void
  onToggleSafetyZones: () => void
  onFitToSelection: () => void
  onFocusSearch: () => void
  onResetCamera: () => void
  onCycleHeatmapMode: () => void
  isEnabled: boolean
}

export function HotkeyManager({
  onToggleHeatmap,
  onToggleLabels,
  onTogglePickPath,
  onToggleSafetyZones,
  onFitToSelection,
  onFocusSearch,
  onResetCamera,
  onCycleHeatmapMode,
  isEnabled
}: HotkeyManagerProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return

    // Prevent hotkeys when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }

    const { key, ctrlKey, metaKey, altKey } = event

    // Single key shortcuts
    switch (key.toLowerCase()) {
      case 'h':
        event.preventDefault()
        onToggleHeatmap()
        break
      case 'l':
        event.preventDefault()
        onToggleLabels()
        break
      case 'p':
        event.preventDefault()
        onTogglePickPath()
        break
      case 's':
        event.preventDefault()
        onToggleSafetyZones()
        break
      case 'f':
        event.preventDefault()
        onFitToSelection()
        break
      case 'r':
        event.preventDefault()
        onResetCamera()
        break
      case 'm':
        event.preventDefault()
        onCycleHeatmapMode()
        break
      case '/':
        event.preventDefault()
        onFocusSearch()
        break
      case 'escape':
        event.preventDefault()
        // Clear selection or close panels
        break
    }

    // Ctrl/Cmd + key shortcuts
    if (ctrlKey || metaKey) {
      switch (key.toLowerCase()) {
        case 'f':
          event.preventDefault()
          onFocusSearch()
          break
        case 'r':
          event.preventDefault()
          onResetCamera()
          break
      }
    }

    // Alt + key shortcuts
    if (altKey) {
      switch (key.toLowerCase()) {
        case 'h':
          event.preventDefault()
          onToggleHeatmap()
          break
        case 'l':
          event.preventDefault()
          onToggleLabels()
          break
        case 'p':
          event.preventDefault()
          onTogglePickPath()
          break
      }
    }
  }, [
    isEnabled,
    onToggleHeatmap,
    onToggleLabels,
    onTogglePickPath,
    onToggleSafetyZones,
    onFitToSelection,
    onFocusSearch,
    onResetCamera,
    onCycleHeatmapMode
  ])

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, isEnabled])

  return null
}

// Hotkey Help Component
export function HotkeyHelp({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  if (!isVisible) return null

  const hotkeys = [
    { key: 'H', description: 'Toggle heatmap' },
    { key: 'L', description: 'Toggle bin labels' },
    { key: 'P', description: 'Toggle pick paths' },
    { key: 'S', description: 'Toggle safety zones' },
    { key: 'F', description: 'Fit camera to selection' },
    { key: 'R', description: 'Reset camera position' },
    { key: 'M', description: 'Cycle heatmap mode' },
    { key: '/', description: 'Focus search input' },
    { key: 'ESC', description: 'Clear selection' },
    { key: 'Ctrl+F', description: 'Focus search' },
    { key: 'Ctrl+R', description: 'Reset camera' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          {hotkeys.map((hotkey) => (
            <div key={hotkey.key} className="flex justify-between items-center">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                {hotkey.key}
              </kbd>
              <span className="text-sm text-gray-600">{hotkey.description}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Hotkeys are disabled when typing in input fields.
          </p>
        </div>
      </div>
    </div>
  )
}







































































