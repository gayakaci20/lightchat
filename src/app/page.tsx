'use client'

import { Sidebar } from '@/components/Sidebar'
import { Chat } from '@/components/Chat'
import { useStore } from '@/lib/store'
import { Bars3Icon } from '@heroicons/react/24/outline'

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
  } = useStore()

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
        {currentConversation ? (
          <Chat />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={addConversation}
              className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
            >
              Démarrer une nouvelle conversation
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
