'use client'

import { Sidebar } from '@/components/Sidebar'
import { Chat } from '@/components/Chat'
import { useStore } from '@/lib/store'
import { Bars3Icon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useState, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Message } from '@/lib/store'
import { ChatMessage } from '@/components/ChatMessage'
import Image from 'next/image'

export default function Home() {
  const {
    conversations,
    currentConversation,
    addConversation,
    deleteConversation,
    selectConversation,
    isMobileMenuOpen,
    setMobileMenuOpen,
    editConversation,
    addMessage,
    selectedModel,
  } = useStore()

  const [firstInput, setFirstInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentChat = conversations.find((c) => c.id === currentConversation)
  const hasMessages = currentChat && currentChat.messages.length > 0
  const messages = currentChat?.messages || []

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier si le fichier est une image ou un PDF
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setUploadedFile(file)
      } else {
        alert('Seuls les fichiers images (JPG, PNG, GIF, etc.) et PDF sont supportés.')
      }
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if ((!firstInput.trim() && !uploadedFile) || creating) return
      setCreating(true)
      let newId = currentConversation
      if (!currentConversation) {
        newId = addConversation()
        selectConversation(newId)
      }
      addMessage(firstInput, 'user')
      setFirstInput('')
      
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: selectedModel })
        const chat = model.startChat({
          history: messages.map((msg: Message) => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        })

        const result = await chat.sendMessage(firstInput)
        const response = await result.response
        const text = response.text()

        addMessage(text, 'ai')
      } catch (error) {
        console.error('Error:', error)
        addMessage('Désolé, une erreur est survenue. Veuillez vérifier votre clé API et réessayer.', 'ai')
      } finally {
        setCreating(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!firstInput.trim() && !uploadedFile) || creating) return
    setCreating(true)
    let newId = currentConversation
    if (!currentConversation) {
      newId = addConversation()
      selectConversation(newId)
    }
    addMessage(firstInput, 'user')
    setFirstInput('')
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: selectedModel })
      const chat = model.startChat({
        history: messages.map((msg: Message) => ({
          role: msg.type === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
      })

      const result = await chat.sendMessage(firstInput)
      const response = await result.response
      const text = response.text()

      addMessage(text, 'ai')
    } catch (error) {
      console.error('Error:', error)
      addMessage('Désolé, une erreur est survenue. Veuillez vérifier votre clé API et réessayer.', 'ai')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 flex bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-gray-900 p-2 text-white md:hidden"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onNewChat={addConversation}
        onSelectChat={selectConversation}
        onDeleteChat={deleteConversation}
        onEditChat={editConversation}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden relative w-full">
        {currentConversation && hasMessages ? (
          <Chat />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-xl flex flex-col items-center px-4 pb-20 md:pb-0"
            >
              <h2 className="text-2xl font-semibold text-white mb-6 md:-ml-12">Comment puis-je vous aider ?</h2>
              <div className="flex flex-col w-full gap-4">
                {uploadedFile && (
                  <div className="flex items-center gap-3 p-3 pr-8 bg-gray-800 rounded-xl w-fit relative">
                    <div className="bg-gray-900 p-2 rounded-lg flex items-center justify-center">
                      {uploadedFile.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(uploadedFile)}
                          alt={uploadedFile.name}
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
                      value={firstInput}
                      onChange={e => setFirstInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Poser une question"
                      className="w-full resize-none rounded-2xl border border-gray-800 bg-gray-800 p-3 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                      rows={1}
                      style={{ maxHeight: '150px' }}
                      disabled={creating}
                      autoFocus
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
                      disabled={creating || (!firstInput.trim() && !uploadedFile)}
                      className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-center"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            {creating && (
              <div className="mt-4">
                <ChatMessage
                  content=""
                  type="ai"
                  isLoading={true}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
