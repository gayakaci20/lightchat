import './globals.css'
import { Poppins } from 'next/font/google'
import { Metadata, Viewport } from 'next'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LightChat',
  description: 'A modern chat interface powered by Google Gemini AI',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/leaf.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/leaf.png',
    },
  },
  manifest: '/manifest.json'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full overflow-hidden">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/leaf.png" />
      </head>
      <body className={`${poppins.className} antialiased h-full overflow-hidden bg-gray-900`}>
        {children}
      </body>
    </html>
  )
}
