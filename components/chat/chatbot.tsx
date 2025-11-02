'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, User, Send, X, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelSelector } from './model-selector'

interface Model {
  id: string
  name: string
  provider: 'google' | 'openai'
  description: string
  cost: 'low' | 'medium' | 'high'
  recommended?: boolean
}

const DEFAULT_MODEL: Model = {
  id: 'gemini-2.5-flash-lite',
  name: 'Gemini 2.5 Flash-Lite',
  provider: 'google',
  description: 'Ultra fast model optimized for cost-efficiency and high throughput',
  cost: 'low',
  recommended: true,
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<Model>(DEFAULT_MODEL)
  const modelRef = useRef<Model>(DEFAULT_MODEL)
  
  // Keep ref in sync with state
  useEffect(() => {
    modelRef.current = selectedModel
  }, [selectedModel])
  
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (url, options) => {
        const currentModel = modelRef.current
        const response = await fetch(url, {
          ...options,
          body: options?.body
            ? JSON.stringify({
                ...JSON.parse(options.body as string),
                modelId: currentModel.id,
                provider: currentModel.provider,
              })
            : JSON.stringify({
                messages: [],
                modelId: currentModel.id,
                provider: currentModel.provider,
              }),
          headers: {
            ...(options?.headers as Record<string, string>),
            'Content-Type': 'application/json',
          },
        })
        return response
      },
    }),
    onError: (error: Error) => {
      console.error('Chat error:', error)
    },
  })
  
  const { messages, status, sendMessage, error } = chat
  const isLoading = status === 'submitted' || status === 'streaming'

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'fixed bottom-4 right-4 pt-6 pb-0 z-50 w-[420px] shadow-2xl transition-all duration-300 flex flex-col',
        isMinimized ? 'h-16' : 'h-[600px]'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Luno AI Assistant
        </CardTitle>
        <div className="flex gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={(model) => {
              setSelectedModel(model)
              // Reset chat to use new model
              chat.setMessages([])
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex flex-col p-0 h-[calc(600px-65px)]">
            <ScrollArea className="flex-1 px-4 py-4 min-h-0">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Hi! I'm Luno, your AI financial assistant.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      I can help you manage transactions, analyze spending, check budgets, and more.
                      Try asking: "What's my spending this month?" or "Show me my account balances"
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.parts?.map((part: any, idx: number) => {
                          if (part.type === 'text') {
                            return <span key={idx}>{part.text}</span>
                          }
                          return null
                        }) || <span>No content</span>}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    Error: {error.message}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (input.trim() && !isLoading) {
                    sendMessage({ text: input })
                    setInput('')
                  }
                }}
              >
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your finances..."
                    disabled={isLoading}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (input.trim() && !isLoading) {
                          sendMessage({ text: input })
                          setInput('')
                        }
                      }
                    }}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}

