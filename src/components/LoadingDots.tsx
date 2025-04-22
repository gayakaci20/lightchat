'use client'

import { useState, useEffect } from 'react'

export function LoadingDots() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return <span className="inline-block min-w-[24px]">{dots}</span>
} 