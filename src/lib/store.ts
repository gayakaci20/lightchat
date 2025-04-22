import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
}

export type ModelType = 
  | 'gemini-1.5-flash' 
  | 'gemini-1.5-pro' 
  | 'gemini-2.5-flash-preview-04-17' 
  | 'gemini-2.0-flash'
  | 'gemini-2.5-pro-preview-03-25'
  | 'gemini-2.0-flash-exp-image-generation'
  | 'gemini-2.0-flash-lite'
  | 'gemma-3-1b-it'

interface ChatStore {
  conversations: Conversation[]
  currentConversation: string | null
  selectedModel: ModelType
  addConversation: () => string
  deleteConversation: (id: string) => void
  selectConversation: (id: string) => void
  addMessage: (content: string, type: 'user' | 'ai') => void
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (isOpen: boolean) => void
  setSelectedModel: (model: ModelType) => void
  generateConversationTitle: (messages: Message[]) => Promise<string>
}

export const useStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      isMobileMenuOpen: false,
      selectedModel: 'gemma-3-1b-it',

      generateConversationTitle: async (messages: Message[]) => {
        try {
          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
          
          const conversationText = messages
            .map(msg => `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`)
            .join('\n')
          
          const prompt = `Analyse cette conversation et génère un titre court et pertinent (maximum 30 caractères) qui résume le sujet principal. Le titre doit être en français et ne doit pas contenir de ponctuation finale.

Conversation:
${conversationText}

Titre:`

          const result = await model.generateContent(prompt)
          const response = await result.response
          const title = response.text().trim()
          
          return title || 'Nouvelle conversation'
        } catch (error) {
          console.error('Error generating title:', error)
          return 'Nouvelle conversation'
        }
      },

      addConversation: () => {
        const newConversation: Conversation = {
          id: uuidv4(),
          title: 'Nouvelle conversation',
          messages: [],
          timestamp: new Date(),
        }
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversation: newConversation.id,
        }))
        return newConversation.id
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const newState = {
            conversations: state.conversations.filter((conv) => conv.id !== id),
            currentConversation:
              state.currentConversation === id ? null : state.currentConversation,
          }
          
          if (newState.conversations.length === 0) {
            const newConversation: Conversation = {
              id: uuidv4(),
              title: 'Nouvelle conversation',
              messages: [],
              timestamp: new Date(),
            }
            return {
              conversations: [newConversation],
              currentConversation: newConversation.id,
            }
          }
          
          return newState
        })
      },

      selectConversation: (id: string) => {
        set({ currentConversation: id })
      },

      addMessage: async (content: string, type: 'user' | 'ai') => {
        const state = get()
        let conversationId = state.currentConversation

        if (!conversationId) {
          conversationId = state.addConversation()
        }

        const newMessage: Message = {
          id: uuidv4(),
          content: String(content),
          type,
          timestamp: new Date(),
        }

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  timestamp: new Date(),
                }
              : conv
          ),
        }))

        // Générer un nouveau titre si c'est le premier message
        const conversation = state.conversations.find(c => c.id === conversationId)
        if (conversation && conversation.messages.length === 0 && type === 'user') {
          const newTitle = await state.generateConversationTitle([newMessage])
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? { ...conv, title: newTitle }
                : conv
            ),
          }))
        }
      },

      setMobileMenuOpen: (isOpen: boolean) => {
        set({ isMobileMenuOpen: isOpen })
      },

      setSelectedModel: (model: ModelType) => {
        set({ selectedModel: model })
      },
    }),
    {
      name: 'chat-storage',
    }
  )
) 