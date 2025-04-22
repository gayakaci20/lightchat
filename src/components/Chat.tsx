'use client'

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { ChatMessage } from './ChatMessage'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useStore } from '@/lib/store'
import { LoadingDots } from './LoadingDots'
import { ModelSelector } from './ModelSelector'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
}

// Créer un composant mémorisé pour les messages
const MessagesList = memo(({ messages, isLoading }: { messages: Message[], isLoading: boolean }) => (
  <>
    {messages.length === 0 ? (
      <div className="flex items-center justify-center h-full text-gray-400">
        Commencez une nouvelle conversation...
      </div>
    ) : (
      messages.map((message) => (
        <ChatMessage
          key={message.id}
          content={String(message.content)}
          type={message.type}
        />
      ))
    )}
    {isLoading && (
      <ChatMessage
        content={<LoadingDots />}
        type="ai"
        isLoading={true}
      />
    )}
  </>
))

MessagesList.displayName = 'MessagesList'

export function Chat() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { conversations, currentConversation, addMessage, addConversation, selectedModel } = useStore()

  // Créer une nouvelle conversation si aucune n'existe
  useEffect(() => {
    if (conversations.length === 0) {
      addConversation()
    }
  }, [conversations.length, addConversation])

  const currentChat = conversations.find((c) => c.id === currentConversation)
  const messages = useMemo(() => currentChat?.messages || [], [currentChat?.messages])

  // Optimiser la gestion de l'input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
  }, [])

  // Optimiser le scroll
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }, [])

  const analyzeFile = useCallback(async (file: File, userMessage: string = '') => {
    setIsLoading(true)
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      
      // Convertir le fichier en base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string
        const base64Content = base64Data.split(',')[1] // Enlever le préfixe data:image/jpeg;base64,
        
        // Créer le modèle avec la capacité de traiter les images
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-pro',
          generationConfig: {
            temperature: 0.1,
            topK: 10,
            topP: 0.5,
            maxOutputTokens: 512,
          }
        })
        
        // Préparer le contenu en fonction du type de fichier
        let prompt = ""
        if (file.type.startsWith('image/')) {
          prompt = userMessage 
            ? `Analyse cette image et réponds à ma demande: ${userMessage}` 
            : "Analyse cette image et décris ce que tu vois en détail."
        } else {
          prompt = userMessage 
            ? `Analyse ce document et réponds à ma demande: ${userMessage}` 
            : "Analyse ce document et résume son contenu."
        }
        
        // Envoyer le fichier à l'IA
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: file.type,
              data: base64Content
            }
          }
        ])
        
        const response = await result.response
        const text = response.text()
        
        addMessage(text, 'ai')
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error analyzing file:', error)
      addMessage('Désolé, une erreur est survenue lors de l\'analyse du fichier.', 'ai')
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom])

  // Optimiser la gestion du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !uploadedFile) || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    
    // Si un fichier est uploadé, l'envoyer avec le message
    if (uploadedFile) {
      // Si c'est une image, on peut l'afficher directement
      if (uploadedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageData = e.target?.result as string
          const messageContent = userMessage 
            ? `${userMessage}\n\n![Image uploadée](${imageData})`
            : `![Image uploadée](${imageData})`
          addMessage(messageContent, 'user')
        }
        reader.readAsDataURL(uploadedFile)
      } else {
        // Pour les documents, on affiche le nom du fichier
        const messageContent = userMessage
          ? `${userMessage}\n\n📄 **${uploadedFile.name}**`
          : `📄 **${uploadedFile.name}**`
        addMessage(messageContent, 'user')
      }
      
      // Analyser le fichier avec l'IA
      await analyzeFile(uploadedFile, userMessage)
      
      // Réinitialiser l'état du fichier
      setUploadedFile(null)
    } else {
      // Comportement normal pour un message texte
      addMessage(userMessage, 'user')
      scrollToBottom()

      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
        
        // Vérifier si le modèle sélectionné est le modèle de génération d'images
        if (selectedModel === 'gemini-2.0-flash-exp-image-generation') {
          // Utiliser le modèle de génération d'images
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash',
            generationConfig: {
              temperature: 0.1,
              topK: 10,
              topP: 0.5,
              maxOutputTokens: 512,
            }
          })
          
          // Générer l'image avec les modalités de réponse appropriées
          const prompt = "Génère une image réaliste d'un chat. Voici la description: " + userMessage
          
          // Utiliser l'API de génération d'images
          const result = await model.generateContent(prompt)
          
          const response = await result.response
          
          // Vérifier si la réponse contient une image
          if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0]
            
            // Construire le message avec le texte et l'image
            let messageContent = ""
            
            // Ajouter le texte de la réponse
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  messageContent += part.text + "\n\n"
                }
              }
            }
            
            // Ajouter l'image si disponible
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType === "image/jpeg") {
                  const imageData = part.inlineData.data
                  messageContent += `![Image générée](data:image/jpeg;base64,${imageData})`
                }
              }
            }
            
            // Si aucun contenu n'a été généré, ajouter un message par défaut
            if (!messageContent) {
              messageContent = "Désolé, je n'ai pas pu générer l'image demandée. Veuillez réessayer avec une description différente."
            }
            
            addMessage(messageContent, 'ai')
          } else {
            // Essayer une approche alternative pour la génération d'images
            try {
              // Utiliser l'API de génération d'images avec des paramètres spécifiques
              const imageResult = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.NEXT_PUBLIC_GEMINI_API_KEY, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: prompt
                    }]
                  }],
                  generationConfig: {
                    temperature: 0.1,
                    topK: 10,
                    topP: 0.5,
                    maxOutputTokens: 512,
                  },
                  safetySettings: [
                    {
                      category: "HARM_CATEGORY_HARASSMENT",
                      threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                      category: "HARM_CATEGORY_HATE_SPEECH",
                      threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                      threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                      threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                  ]
                })
              })
              
              const imageData = await imageResult.json()
              
              if (imageData.candidates && imageData.candidates.length > 0) {
                const candidate = imageData.candidates[0]
                let messageContent = ""
                
                // Ajouter le texte de la réponse
                if (candidate.content && candidate.content.parts) {
                  for (const part of candidate.content.parts) {
                    if (part.text) {
                      messageContent += part.text + "\n\n"
                    }
                  }
                }
                
                // Ajouter l'image si disponible
                if (candidate.content && candidate.content.parts) {
                  for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.mimeType === "image/jpeg") {
                      const imageData = part.inlineData.data
                      messageContent += `![Image générée](data:image/jpeg;base64,${imageData})`
                    }
                  }
                }
                
                if (messageContent) {
                  addMessage(messageContent, 'ai')
                } else {
                  addMessage("Désolé, je n'ai pas pu générer l'image demandée. Veuillez réessayer avec une description différente.", 'ai')
                }
              } else {
                addMessage("Désolé, je n'ai pas pu générer l'image demandée. Veuillez réessayer avec une description différente.", 'ai')
              }
            } catch (error) {
              console.error('Error generating image:', error)
              addMessage("Désolé, je n'ai pas pu générer l'image demandée. Veuillez réessayer avec une description différente.", 'ai')
            }
          }
        } else {
          // Utiliser le modèle de chat normal
          const model = genAI.getGenerativeModel({ model: selectedModel })
          const chat = model.startChat({
            history: messages.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            })),
          })

          const result = await chat.sendMessage(userMessage)
          const response = await result.response
          const text = response.text()

          addMessage(text, 'ai')
        }
      } catch (error) {
        console.error('Error:', error)
        addMessage('Désolé, une erreur est survenue. Veuillez vérifier votre clé API et réessayer.', 'ai')
      } finally {
        setIsLoading(false)
        scrollToBottom()
      }
    }
  }, [input, uploadedFile, isLoading, addMessage, selectedModel, messages, analyzeFile, scrollToBottom])

  // Optimiser la gestion des touches
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 pt-12">
        <MessagesList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 fixed bottom-0 left-0 right-0 bg-gray-900 z-10 safe-bottom md:left-72">
        <div className="flex flex-col w-full p-4 gap-4">
          {uploadedFile && (
            <div className="flex items-center gap-3 p-3 pr-8 bg-gray-800 rounded-xl w-fit relative">
              <div className="bg-pink-500 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-white font-medium truncate max-w-[200px]">
                  {uploadedFile.name}
                </span>
                <span className="text-xs text-gray-400">
                  {uploadedFile.type.split('/')[1].toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="flex gap-2 w-full items-center">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Poser une question"
                className="w-full resize-none rounded-2xl border border-gray-800 bg-gray-800 p-3 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={1}
                style={{ maxHeight: '150px' }}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 top-1/2 transform -translate-y-3 text-gray-400 hover:text-white transition-colors"
                title="Joindre un fichier"
              >
                <Image
                  src="/paperclip.svg"
                  alt="Joindre un fichier"
                  width={20}
                  height={20}
                  className="w-5 h-5 brightness-0 invert"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !uploadedFile)}
                className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
} 