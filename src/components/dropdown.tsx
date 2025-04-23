'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  children: ReactNode
  className?: string
}

interface DropdownButtonProps {
  children: ReactNode
  className?: string
  outline?: boolean
  onClick?: () => void
}

interface DropdownMenuProps {
  children: ReactNode
  className?: string
  anchor?: 'top start' | 'top end' | 'bottom start' | 'bottom end'
}

interface DropdownItemProps {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
}

export function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<DropdownButtonProps | DropdownMenuProps>(child)) {
          if (child.type === DropdownButton) {
            return React.cloneElement(child, {
              onClick: () => setIsOpen(!isOpen),
            })
          }
          if (child.type === DropdownMenu && isOpen) {
            return React.cloneElement(child)
          }
        }
        return null
      })}
    </div>
  )
}

export function DropdownButton({ children, className, outline, onClick }: DropdownButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors',
        outline && 'border border-gray-700',
        className
      )}
    >
      {children}
    </button>
  )
}

export function DropdownMenu({ children, className, anchor = 'bottom start' }: DropdownMenuProps) {
  const anchorClasses = {
    'top start': 'bottom-full left-0 mb-2',
    'top end': 'bottom-full right-0 mb-2',
    'bottom start': 'top-full left-0 mt-2',
    'bottom end': 'top-full right-0 mt-2',
  }

  return (
    <div
      className={cn(
        'absolute w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10',
        anchorClasses[anchor],
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownItem({ children, className, href, onClick }: DropdownItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors',
          className
        )}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors',
        className
      )}
    >
      {children}
    </button>
  )
} 