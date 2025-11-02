'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
        const body = options?.body 
          ? JSON.parse(options.body as string)
          : { messages: [] }
        
        // Merge model info into the request body
        const modifiedBody = {
          ...body,
          modelId: currentModel.id,
          provider: currentModel.provider,
        }
        
        const response = await fetch(url, {
          ...options,
          body: JSON.stringify(modifiedBody),
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
          className="h-14 w-14 rounded-xl shadow-lg"
        >
          <Bot size={40} />
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
          <CardContent className="flex flex-col p-0 h-[calc(600px-100px)]">
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
                      <div className="text-sm wrap-break-word prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:my-2">
                        {/* AI SDK v5 message format: check parts first (most common), then content */}
                        {(() => {
                          // Handle tool invocations for multi-step tool calling
                          // AI SDK v5 includes tool invocations in message.parts
                          if (message.role === 'assistant' && Array.isArray(message.parts)) {
                            return (
                              <div className="space-y-2">
                                {message.parts.map((part: any, index: number) => {
                                  // Handle text parts
                                  if (part.type === 'text' && part.text) {
                                    return (
                                      <ReactMarkdown
                                        key={`text-${index}`}
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                          li: ({ children }) => <li className="mb-1">{children}</li>,
                                          code: ({ className, children, ...props }) => {
                                            const isInline = !className
                                            return isInline ? (
                                              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                {children}
                                              </code>
                                            ) : (
                                              <code className={cn("block bg-muted p-2 rounded text-xs font-mono overflow-x-auto", className)} {...props}>
                                                {children}
                                              </code>
                                            )
                                          },
                                          pre: ({ children }) => (
                                            <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                                              {children}
                                            </pre>
                                          ),
                                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                                          h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                          em: ({ children }) => <em className="italic">{children}</em>,
                                          blockquote: ({ children }) => (
                                            <blockquote className="border-l-4 border-muted-foreground pl-3 italic my-2">
                                              {children}
                                            </blockquote>
                                          ),
                                          a: ({ href, children }) => (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                              {children}
                                            </a>
                                          ),
                                        }}
                                      >
                                        {part.text}
                                      </ReactMarkdown>
                                    )
                                  }
                                  
                                  // Handle tool invocation parts (for multi-step tool calling)
                                  if (part.type?.startsWith('tool-') || part.toolName) {
                                    const toolName = part.toolName || part.type?.replace('tool-', '') || 'unknown'
                                    const state = part.state || 'pending'
                                    const isExecuting = state === 'call' || state === 'result'
                                    
                                    return (
                                      <div key={`tool-${index}`} className="bg-muted/50 rounded p-2 text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            isExecuting ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                                          )} />
                                          <span className="font-mono font-semibold">{toolName}</span>
                                          <span className="text-muted-foreground">
                                            {state === 'call' ? 'executing...' : state === 'result' ? 'completed' : 'pending'}
                                          </span>
                                        </div>
                                        {part.result && (
                                          <div className="mt-1 text-muted-foreground">
                                            {typeof part.result === 'string' 
                                              ? part.result.substring(0, 100) + (part.result.length > 100 ? '...' : '')
                                              : JSON.stringify(part.result).substring(0, 100)}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                  
                                  return null
                                })}
                              </div>
                            )
                          }
                          
                          // Fallback: Extract text content from message (legacy format)
                          let textContent = ''
                          
                          // Try parts array first (useChat with DefaultChatTransport uses parts)
                          if (Array.isArray(message.parts) && message.parts.length > 0) {
                            textContent = message.parts
                              .map((part: any) => {
                                // Handle text parts
                                if (part.type === 'text' && part.text) {
                                  return part.text
                                }
                                // Handle plain string in parts
                                if (typeof part === 'string') {
                                  return part
                                }
                                // Handle parts with content property
                                if (part.content) {
                                  return part.content
                                }
                                return ''
                              })
                              .filter(Boolean)
                              .join('')
                          } else if (message.parts?.[0]?.type === 'text' && message.parts?.[0]?.text?.trim()) {
                            textContent = message.parts[0].text.trim()
                          } else if (typeof (message as any).content === 'string') {
                            textContent = (message as any).content
                          }
                          
                          // Render markdown for assistant messages, plain text for user messages
                          if (textContent) {
                            if (message.role === 'assistant') {
                              return (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    code: ({ className, children, ...props }) => {
                                      const isInline = !className
                                      return isInline ? (
                                        <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                          {children}
                                        </code>
                                      ) : (
                                        <code className={cn("block bg-muted p-2 rounded text-xs font-mono overflow-x-auto", className)} {...props}>
                                          {children}
                                        </code>
                                      )
                                    },
                                    pre: ({ children }) => (
                                      <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                                        {children}
                                      </pre>
                                    ),
                                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-muted-foreground pl-3 italic my-2">
                                        {children}
                                      </blockquote>
                                    ),
                                    a: ({ href, children }) => (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                        {children}
                                      </a>
                                    ),
                                  }}
                                >
                                  {textContent}
                                </ReactMarkdown>
                              )
                            } else {
                              // User messages: plain text (no markdown)
                              return <span className="whitespace-pre-wrap">{textContent}</span>
                            }
                          }
                          
                          // Loading state for assistant messages
                          if (message.role === 'assistant') {
                            return <span className="text-muted-foreground italic">Loading...</span>
                          }
                          
                          // No content
                          return null
                        })()}
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

