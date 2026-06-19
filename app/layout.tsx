import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Promoções',
  description: 'Receba promoções exclusivas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Promoções',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
