'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  async function subscribe() {
    setStatus('loading')
    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        setStatus('subscribed')
        setMessage('Você já está inscrito para receber notificações!')
        return
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })

      if (res.ok) {
        setStatus('subscribed')
        setMessage('Inscrito com sucesso! Você receberá nossas promoções.')
      } else {
        throw new Error('Falha ao salvar inscrição')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Erro ao se inscrever. Verifique as permissões do navegador.')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔔</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Receba nossas Promoções
        </h1>
        <p className="text-gray-500 mb-8">
          Ative as notificações e seja o primeiro a saber sobre nossas ofertas exclusivas!
        </p>

        {status === 'subscribed' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            ✅ {message}
          </div>
        ) : status === 'error' ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            ❌ {message}
          </div>
        ) : (
          <button
            onClick={subscribe}
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            {status === 'loading' ? 'Ativando...' : '🔔 Ativar Notificações'}
          </button>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Você pode desativar a qualquer momento nas configurações do navegador.
        </p>
      </div>
    </main>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
