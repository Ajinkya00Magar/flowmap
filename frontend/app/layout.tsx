import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { RoadmapProvider } from '@/components/providers/RoadmapProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'

export const metadata: Metadata = {
  title: 'FlowMap — Your Learning Universe',
  description: 'An interactive floating roadmap for your entire learning journey.',
  keywords: ['learning roadmap', 'knowledge graph', 'study tracker', 'skill map'],
}

export const viewport: Viewport = {
  themeColor: '#050810',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#050810', height: '100vh', overflow: 'hidden' }}>
        <ToastProvider>
          <AuthProvider>
            <RoadmapProvider>
              {children}
            </RoadmapProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
