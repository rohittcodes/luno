'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Provider = 'google' | 'openai'

interface Model {
  id: string
  name: string
  provider: Provider
  description: string
  cost: 'low' | 'medium' | 'high'
  recommended?: boolean
}

const MODELS: Model[] = [
  // Gemini Models (Cheaper options first)
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    description: 'Ultra fast model optimized for cost-efficiency and high throughput',
    cost: 'low',
    recommended: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: 'google',
    description: 'Fast small workhorse model with 1M token context',
    cost: 'low',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Best price-performance, great for large scale processing and agentic use cases',
    cost: 'low',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Second generation workhorse with 1M token context',
    cost: 'medium',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'State-of-the-art thinking model for complex reasoning and analysis',
    cost: 'high',
  },
  // OpenAI Models (Cheaper options first)
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 nano',
    provider: 'openai',
    description: 'Fastest, most cost-efficient version of GPT-5',
    cost: 'low',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    description: 'Smartest non-reasoning model',
    cost: 'medium',
  },
  {
    id: 'gpt-5-pro',
    name: 'GPT-5 pro',
    provider: 'openai',
    description: 'Version of GPT-5 that produces smarter and more precise responses',
    cost: 'high',
  },
]

const DEFAULT_MODEL = MODELS.find((m) => m.id === 'gemini-2.5-flash-lite') || MODELS[0]

interface ModelSelectorProps {
  selectedModel?: Model
  onModelChange?: (model: Model) => void
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [localProvider, setLocalProvider] = useState<Provider>(
    selectedModel?.provider || DEFAULT_MODEL.provider
  )
  const [localModelId, setLocalModelId] = useState<string>(
    selectedModel?.id || DEFAULT_MODEL.id
  )

  function handleSave() {
    const selectedModelObj = MODELS.find((m) => m.id === localModelId)

    if (!selectedModelObj) {
      return
    }

    onModelChange?.(selectedModelObj)
    setOpen(false)
  }

  // Sync with prop changes
  useEffect(() => {
    if (selectedModel) {
      setLocalProvider(selectedModel.provider)
      setLocalModelId(selectedModel.id)
    }
  }, [selectedModel])

  const availableModels = MODELS.filter((m) => m.provider === localProvider)
  const currentSelectedModel = MODELS.find((m) => m.id === localModelId) || DEFAULT_MODEL

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Select AI Model"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Select AI Model
          </DialogTitle>
          <DialogDescription>
            Choose your preferred AI provider and model for this session. Lower cost models are recommended for
            most use cases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={localProvider}
              onValueChange={(value) => {
                setLocalProvider(value as Provider)
                // Auto-select first model of new provider
                const firstModel = MODELS.find((m) => m.provider === value)
                if (firstModel) {
                  setLocalModelId(firstModel.id)
                }
              }}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google (Gemini)</SelectItem>
                <SelectItem value="openai">OpenAI (GPT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={localModelId} onValueChange={setLocalModelId}>
              <SelectTrigger id="model" className="w-full min-h-12 h-auto py-2">
                <SelectValue>
                  {currentSelectedModel && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{currentSelectedModel.name}</span>
                      {currentSelectedModel.recommended && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                          Recommended
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded shrink-0',
                          currentSelectedModel.cost === 'low'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : currentSelectedModel.cost === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        )}
                      >
                        {currentSelectedModel.cost === 'low'
                          ? '💰 Low Cost'
                          : currentSelectedModel.cost === 'medium'
                          ? '💵 Medium Cost'
                          : '💸 High Cost'}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{model.name}</span>
                        {model.recommended && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                            Recommended
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded shrink-0 ml-auto',
                            model.cost === 'low'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : model.cost === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          )}
                        >
                          {model.cost === 'low'
                            ? '💰 Low Cost'
                            : model.cost === 'medium'
                            ? '💵 Medium Cost'
                            : '💸 High Cost'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Model Info */}
          {currentSelectedModel && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Selected:</span>
                  <span className="text-muted-foreground">{currentSelectedModel.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{currentSelectedModel.description}</p>
              </div>
            </div>
          )}

          {/* Cost Comparison Info */}
          <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Start with low-cost models for regular use. Upgrade to
              advanced models only for complex reasoning tasks.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Select Model
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

