'use client'

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Conversation {
  id: string
  title: string
  timestamp: Date
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversation: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  conversations,
  currentConversation,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex w-72 flex-col bg-gray-900 border-r border-gray-800 text-gray-100 transition-transform duration-300 md:relative md:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between p-2 md:hidden">
          <h2 className="text-xl font-bold text-gray-100 pt-15"></h2>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-2 hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-shrink-0 p-2 pt-2">
          <div className="py-4 mb-2">
            <div className="flex items-center justify-center gap-1">
              <Image
                src="/leaf.png"
                alt="LightChat Logo"
                width={25}
                height={25}
                priority
                unoptimized
                className="brightness-0 invert md:brightness-100 md:invert-0"
              />
              <h1 className="text-xl font-bold text- ">LightChat</h1>
            </div>
          </div>

          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            <PlusIcon className="h-5 w-5" />
            Nouvelle conversation
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          <ul className="space-y-2">
            {conversations.map((chat) => (
              <motion.li
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800',
                    currentConversation === chat.id && 'bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src="/message-square.svg"
                      alt="Message"
                      width={20}
                      height={20}
                      className="w-5 h-5 brightness-0 invert"
                    />
                    <span className="line-clamp-1">{chat.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(chat.id)
                    }}
                    className="rounded p-1 hover:bg-gray-700"
                    aria-label="Supprimer la conversation"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
} 