'use client'

import { useStore, ModelType } from '@/lib/store'

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore()

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="model-select" className="text-sm font-medium text-gray-700">
        Modèle:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as ModelType)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
        <option value="gemma-3-1b-it">Gemma 3 1B IT</option>
      </select>
    </div>
  )
} 