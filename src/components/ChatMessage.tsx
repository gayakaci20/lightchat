'use client'

import { motion } from 'framer-motion'
import { ClipboardIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LoadingDots } from './LoadingDots'
import Image from 'next/image'

type MessageType = 'user' | 'ai'

interface ChatMessageProps {
  content: string | ReactNode
  type: MessageType
  isLoading?: boolean
}

interface CopiedState {
  [key: string]: boolean;
}

export function ChatMessage({ content, type, isLoading }: ChatMessageProps) {
  const [copiedStates, setCopiedStates] = useState<CopiedState>({})
  const [isMessageCopied, setIsMessageCopied] = useState(false)

  // Function to handle code block copying
  const handleCopy = async (text: string, blockId: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopiedStates(prev => ({ ...prev, [blockId]: true }))
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [blockId]: false }))
        }, 2000)
      } else {
        // Fallback pour les environnements où l'API Clipboard n'est pas disponible
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
          setCopiedStates(prev => ({ ...prev, [blockId]: true }))
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [blockId]: false }))
          }, 2000)
        } catch (err) {
          console.error('Fallback copy failed:', err)
        }
        document.body.removeChild(textarea)
      }
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  // Function to handle message copying
  const handleMessageCopy = async () => {
    try {
      const textToCopy = typeof content === 'string' ? content : ''
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy)
        setIsMessageCopied(true)
        setTimeout(() => setIsMessageCopied(false), 2000)
      } else {
        // Fallback pour les environnements où l'API Clipboard n'est pas disponible
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
          setIsMessageCopied(true)
          setTimeout(() => setIsMessageCopied(false), 2000)
        } catch (err) {
          console.error('Fallback copy failed:', err)
        }
        document.body.removeChild(textarea)
      }
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex w-full max-w-4xl mx-auto mb-4',
        type === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn(
        'flex items-start',
        type === 'user' 
          ? 'bg-gray-800 text-white max-w-[85%] px-4 py-3 rounded-2xl shadow-sm' 
          : 'text-gray-100 max-w-[85%] group relative pb-10'
      )}>
        <div className={cn(
          'flex-1 prose prose-sm max-w-none break-words prose-invert',
          type === 'user' ? 'prose-gray' : 'prose-gray'
        )}>
          {isLoading ? (
            <LoadingDots />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => {
                  if (!src) return null
                  if (typeof src === 'string' && src.startsWith('http')) {
                    return (
                      <Image 
                        src={src} 
                        alt={alt || 'Image'} 
                        width={500}
                        height={300}
                        className="max-w-full h-auto rounded-lg"
                      />
                    )
                  }
                  return (
                    <Image 
                      src={typeof src === 'string' ? src : URL.createObjectURL(src)} 
                      alt={alt || 'Image'} 
                      width={500}
                      height={300}
                      className="max-w-full h-auto rounded-lg"
                    />
                  )
                },
                code({ className, children, node, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const code = Array.isArray(children) ? children.join('') : String(children)
                  const isInline = !match || !node?.position?.start.line

                  if (!isInline && match) {
                    const language = match[1]
                    const blockId = `${node?.position?.start.line}-${language}`

                    return (
                      <div className={cn(
                        "relative my-4 rounded-lg overflow-hidden",
                        "w-full max-w-[calc(100vw-2rem)] sm:max-w-[800px]",
                        type === 'user' ? 'bg-gray-900 border-gray-700' : 'bg-gray-800 border border-gray-700'
                      )}>
                        <div className={cn(
                          "flex items-center justify-between px-3 sm:px-4 py-2 border-b",
                          type === 'user' ? 'border-gray-700' : 'border-gray-700 bg-gray-900'
                        )}>
                          <span className={cn(
                            "text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none",
                            type === 'user' ? 'text-gray-300' : 'text-gray-300'
                          )}>{language}</span>
                          <button
                            onClick={() => handleCopy(code, blockId)}
                            className={cn(
                              "transition-colors flex-shrink-0 ml-2",
                              type === 'user' 
                                ? 'text-gray-400 hover:text-white' 
                                : 'text-gray-400 hover:text-white'
                            )}
                            title="Copier le code"
                          >
                            {copiedStates[blockId] ? (
                              <span className={cn(
                                "text-xs sm:text-sm whitespace-nowrap",
                                type === 'user' ? 'text-green-400' : 'text-green-400'
                              )}>Copié !</span>
                            ) : (
                              <ClipboardIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="min-w-0 max-w-full">
                            <SyntaxHighlighter
                              language={language}
                              style={{
                                ...oneDark,
                                'comment': {
                                  color: '#636e7b',
                                  fontStyle: 'italic',
                                  background: 'transparent'
                                },
                                'prolog': {
                                  color: '#636e7b',
                                  background: 'transparent'
                                }
                              }}
                              customStyle={{
                                margin: 0,
                                background: '#282C34',
                                maxWidth: '100%',
                                fontSize: '0.75rem',
                                lineHeight: '1.5',
                                padding: '1rem 0.75rem',
                                whiteSpace: 'pre',
                                overflowX: 'auto',
                              }}
                              wrapLongLines={false}
                            >
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <code
                      className={cn(
                        'px-1.5 py-0.5 rounded-md font-mono text-sm',
                        type === 'user' 
                          ? 'bg-gray-900 text-gray-100' 
                          : 'bg-gray-800 text-gray-100'
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <div className="overflow-x-auto">{children}</div>,
                p: ({ children }) => (
                  <p className={cn(
                    "mb-4 last:mb-0 whitespace-pre-wrap break-words",
                    type === 'user' ? 'text-white' : 'text-gray-100'
                  )}>{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className={cn(
                    "font-bold",
                    type === 'user' ? 'text-white' : 'text-gray-100'
                  )}>{children}</strong>
                ),
                em: ({ children }) => (
                  <em className={cn(
                    "italic",
                    type === 'user' ? 'text-white/90' : 'text-gray-300'
                  )}>{children}</em>
                ),
                h1: ({ children }) => (
                  <h1 className={cn(
                    "text-2xl font-bold mb-4",
                    type === 'user' ? 'text-white' : 'text-gray-100'
                  )}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className={cn(
                    "text-xl font-bold mb-3",
                    type === 'user' ? 'text-white' : 'text-gray-100'
                  )}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className={cn(
                    "text-lg font-bold mb-2",
                    type === 'user' ? 'text-white' : 'text-gray-100'
                  )}>{children}</h3>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
                li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className={cn(
                    "border-l-4 pl-4 italic my-4",
                    type === 'user' 
                      ? 'border-gray-700 text-gray-300' 
                      : 'border-gray-700 text-gray-300'
                  )}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {typeof content === 'string' ? content : ''}
            </ReactMarkdown>
          )}
        </div>
        {type === 'ai' && !isLoading && (
          <button
            onClick={handleMessageCopy}
            className={cn(
              'absolute bottom-1 left p-1.5 rounded-md transition-colors',
              isMessageCopied
                ? 'bg-green-500/20 text-green-500'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
            )}
            title={isMessageCopied ? 'Copié !' : 'Copier le message'}
          >
            <ClipboardIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}