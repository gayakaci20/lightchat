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
  description: 'A fast and modern AI chat interface',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
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
      <head>
        <link 
          rel="icon" 
          href="/favicon.ico" 
          type="image/x-icon" 
          sizes="any"
        />
      </head>
      <body className={`${poppins.className} antialiased h-full overflow-hidden bg-gray-900`}>
        {children}
      </body>
    </html>
  )
}
