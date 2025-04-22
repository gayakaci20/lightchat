'use client'

import { useStore, ModelType } from '@/lib/store'
import { useCallback, memo } from 'react'
import { cn } from '@/lib/utils'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from './dropdown'
import Image from 'next/image'

const ModelButton = memo(({ 
  model, 
  isSelected, 
  onClick 
}: { 
  model: ModelType, 
  isSelected: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 text-sm rounded-lg transition-colors',
      isSelected
        ? 'bg-primary-500 text-white'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    )}
  >
    {model}
  </button>
))

ModelButton.displayName = 'ModelButton'

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore()

  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model)
  }, [setSelectedModel])

  const models: { id: string; name: string }[] = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash-exp-image-generation', name: 'Gemini 2.0 Image' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Lite' },
    { id: 'gemma-3-1b-it', name: 'Gemma 3 1B' },
  ]

  return (
    <Dropdown>
      <DropdownButton className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
        <Image
          src="/gemini.png"
          alt="Gemini"
          width={20}
          height={20}
          className="w-5 h-5 brightness-0 invert md:brightness-100 md:invert-0"
        />
      </DropdownButton>
      <DropdownMenu anchor="top end">
        {models.map((model) => (
          <DropdownItem
            key={model.id}
            onClick={() => handleModelChange(model.id as ModelType)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 relative',
              selectedModel === model.id && 'bg-primary-500/10 text-primary-500 font-medium'
            )}
          >
            <Image
              src="/gemini.png"
              alt="Gemini"
              width={20}
              height={20}
              className={cn(
                "w-5 h-5",
                selectedModel === model.id ? 'brightness-0 invert md:brightness-100 md:invert-0' : 'opacity-50'
              )}
            />
            <span className="text-sm">{model.name}</span>
            {selectedModel === model.id && (
              <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-500"></div>
            )}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
} 