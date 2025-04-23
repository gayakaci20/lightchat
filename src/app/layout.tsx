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
    icon: [
      {
        url: '/leaf.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/leaf.png',
        sizes: '16x16',
        type: 'image/png',
      }
    ],
    apple: [
      {
        url: '/leaf.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
    shortcut: '/leaf.png',
  },
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
      <body className={`${poppins.className} antialiased h-full overflow-hidden bg-gray-900`}>
        {children}
      </body>
    </html>
  )
}
