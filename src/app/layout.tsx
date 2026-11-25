import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ConvexClientProvider } from './providers'

const geistSans = localFont({
  src: './fonts/Geist-latin.woff2',
  weight: '100 900',
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = localFont({
  src: './fonts/GeistMono-latin.woff2',
  weight: '100 900',
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CALAIRE APP',
    template: '%s · CALAIRE APP',
  },
  description: 'Ensayos de Aptitud de Calidad de Aire y Sistema de Gestión del laboratorio CALAIRE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}