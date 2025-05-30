'use client'

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { ChatMessage } from './ChatMessage'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useStore } from '@/lib/store'
import { LoadingDots } from './LoadingDots'
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
  const { conversations, currentConversation, addMessage, addConversation, selectedModel, generateImage } = useStore()

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
      // Vérifier si le fichier est une image ou un PDF
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setUploadedFile(file)
      } else {
        alert('Seuls les fichiers images (JPG, PNG, GIF, etc.) et PDF sont supportés.')
      }
    }
  }, [])

  const analyzeFile = useCallback(async (file: File, userMessage: string = '') => {
    setIsLoading(true)
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      
      // Convertir le fichier en base64
      const reader = new FileReader()
      
      const readFilePromise = new Promise((resolve, reject) => {
        reader.onload = resolve
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string
          const base64Content = base64Data.split(',')[1]
          
          // Fonction pour sélectionner le meilleur modèle
          const getBestModel = (fileType: string, isGeneratingImage: boolean = false) => {
            // Liste des modèles disponibles avec leurs capacités
            const models = {
              'gemini-1.5-flash': {
                supportsImages: true,
                supportsPdf: true,
                speed: 'fast',
                context: 'medium'
              },
              'gemini-1.5-pro': {
                supportsImages: true,
                supportsPdf: true,
                speed: 'medium',
                context: 'large'
              },
              'gemini-2.5-flash-preview-04-17': {
                supportsImages: true,
                supportsPdf: true,
                speed: 'fast',
                context: 'large'
              },
              'gemini-2.0-flash': {
                supportsImages: true,
                supportsPdf: true,
                speed: 'fast',
                context: 'medium'
              },
              'gemini-2.0-flash-exp-image-generation': {
                supportsImages: true,
                supportsPdf: false,
                speed: 'fast',
                context: 'medium',
                canGenerateImages: true
              },
              'gemini-2.0-flash-lite': {
                supportsImages: true,
                supportsPdf: true,
                speed: 'very fast',
                context: 'small'
              },
              'gemma-3-1b-it': {
                supportsImages: false,
                supportsPdf: false,
                speed: 'very fast',
                context: 'small'
              }
            }

            // Si on génère une image, utiliser le modèle spécifique
            if (isGeneratingImage) {
              return 'gemini-2.0-flash-exp-image-generation'
            }

            // Filtrer les modèles en fonction du type de fichier
            const suitableModels = Object.entries(models)
              .filter(([, capabilities]) => {
                if (fileType.startsWith('image/')) {
                  return capabilities.supportsImages
                } else if (fileType === 'application/pdf') {
                  return capabilities.supportsPdf
                }
                return true // Pour les autres types de fichiers, tous les modèles sont acceptables
              })
              .map(([modelName]) => modelName)

            // Si aucun modèle n'est disponible, utiliser le modèle par défaut
            if (suitableModels.length === 0) {
              return 'gemini-2.5-flash-preview-04-17'
            }

            // Retourner le premier modèle disponible
            return suitableModels[0]
          }

          // Sélectionner le meilleur modèle
          const modelName = getBestModel(file.type)
          
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 2048,
              candidateCount: 4
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
            ...(modelName !== 'gemini-2.5-flash-preview-04-17' && base64Content ? [{
              inlineData: {
                mimeType: file.type,
                data: base64Content
              }
            }] : [])
          ])
          
          const response = await result.response
          const text = response.text()
          
          addMessage(text, 'ai')
        } catch (error) {
          console.error('Error processing file:', error)
          addMessage('Désolé, une erreur est survenue lors de l\'analyse du fichier.', 'ai')
        } finally {
          setIsLoading(false)
          scrollToBottom()
        }
      }

      await readFilePromise
      
    } catch (error) {
      console.error('Error analyzing file:', error)
      addMessage('Désolé, une erreur est survenue lors de l\'analyse du fichier.', 'ai')
      setIsLoading(false)
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom])

  // Fonction pour détecter les questions sur le créateur
  const isCreatorQuestion = useCallback((message: string) => {
    const creatorQuestions = [
      'who created you',
      'who made you',
      'who developed you',
      'who designed you',
      'who programmed you',
      'who built you',
      'qui t\'as créé',
      'qui t\'a créé',
      'qui t\'as fait',
      'qui t\'a fait',
      'qui t\'as développé',
      'qui t\'a développé',
      'qui t\'as programmé',
      'qui t\'a programmé',
      'qui t\'as conçu',
      'qui t\'a conçu',
      'qui t\'as construit',
      'qui t\'a construit',
      'your creator',
      'your developer',
      'your maker',
      'your designer',
      'your programmer',
      'your builder'
    ]
    return creatorQuestions.some(question => 
      message.toLowerCase().includes(question.toLowerCase())
    )
  }, [])

  // Optimiser la gestion du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !uploadedFile) || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Vérifier si c'est une demande de génération d'image
    const isGeneratingImage = userMessage.toLowerCase().includes('generate') && 
      (userMessage.toLowerCase().includes('image') || 
       userMessage.toLowerCase().includes('picture') || 
       userMessage.toLowerCase().includes('photo'))

    // Si c'est une demande de génération d'image
    if (isGeneratingImage) {
      setIsLoading(true)
      addMessage(userMessage, 'user')
      
      try {
        const { text, imageUrl } = await generateImage(userMessage)
        
        if (imageUrl) {
          addMessage(`${text}\n\n![Generated Image](${imageUrl})`, 'ai')
        } else {
          addMessage(text, 'ai')
        }
      } catch (error) {
        console.error('Error generating image:', error)
        addMessage('Désolé, une erreur est survenue lors de la génération de l\'image.', 'ai')
      } finally {
        setIsLoading(false)
        scrollToBottom()
      }
      return
    }
    
    // Si un fichier est uploadé, l'envoyer avec le message
    if (uploadedFile) {
      setIsLoading(true)
      // Pour tous les types de fichiers, afficher le nom du fichier
      const messageContent = userMessage
        ? `${userMessage}\n\n📄 **${uploadedFile.name}**`
        : `📄 **${uploadedFile.name}**`
      addMessage(messageContent, 'user')
      
      // Réinitialiser le fichier avant l'analyse
      const fileToAnalyze = uploadedFile
      setUploadedFile(null)
      
      await analyzeFile(fileToAnalyze, userMessage)
    } else {
      // Comportement normal pour un message texte
      addMessage(userMessage, 'user')
      scrollToBottom()
      setIsLoading(true)

      // Vérifier si c'est une question sur le créateur
      if (isCreatorQuestion(userMessage)) {
        addMessage('Gaya Kaci', 'ai')
        setIsLoading(false)
        scrollToBottom()
        return
      }

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
          const prompt = "Génère" + userMessage
          
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
  }, [input, uploadedFile, isLoading, addMessage, selectedModel, messages, analyzeFile, scrollToBottom, isCreatorQuestion, generateImage])

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
              <div className="bg-gray-900 p-2 rounded-lg flex items-center justify-center">
                {uploadedFile.type.startsWith('image/') ? (
                  <Image
                    src={URL.createObjectURL(uploadedFile)}
                    alt={uploadedFile.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded-md border border-gray-700"
                  />
                ) : (
                  <Image
                    src="/file.svg"
                    alt="File"
                    width={20}
                    height={20}
                    className="w-5 h-5 brightness-0 invert"
                  />
                )}
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
                accept="image/*,.pdf"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 top-1/4 text-gray-400 hover:text-white transition-colors"
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
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !uploadedFile)}
                className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-center"
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