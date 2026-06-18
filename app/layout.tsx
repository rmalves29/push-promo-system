import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Push Promo System',
  description: 'Sistema de notificações push para promoções',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
