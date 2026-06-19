'use client'

import { useEffect, useState } from 'react'

function isIos() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone === true
}

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    // Detecta iOS fora do modo standalone (PWA não instalado)
    if (isIos() && !isInStandaloneMode()) {
      setShowIosGuide(true)
      return
    }

    // Auto-subscribe se ?auto=1 na URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('auto') === '1') {
      subscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('error')
      setMessage('Seu navegador não suporta notificações push.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setStatus('error')
      setMessage('Permissão negada. Habilite as notificações nas configurações do navegador.')
      return
    }

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
    } catch {
      setStatus('error')
      setMessage('Erro ao se inscrever. Verifique as permissões do navegador.')
    }
  }

  // Guia para iOS — precisa instalar como PWA primeiro
  if (showIosGuide) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Instale o app para receber promoções
          </h1>
          <p className="text-gray-500 mb-6">
            No iPhone/iPad, siga os passos abaixo para ativar as notificações:
          </p>

          <div className="text-left space-y-4 mb-6">
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold text-gray-700">Toque em Compartilhar</p>
                <p className="text-sm text-gray-500">Toque no ícone <span className="font-bold">□↑</span> na barra inferior do Safari</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-semibold text-gray-700">Adicionar à Tela de Início</p>
                <p className="text-sm text-gray-500">Role para baixo e toque em <span className="font-bold">"Adicionar à Tela de Início"</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-semibold text-gray-700">Abra pelo ícone instalado</p>
                <p className="text-sm text-gray-500">Feche o Safari e abra o app pela tela inicial</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Requer iOS 16.4 ou superior
          </p>
        </div>
      </main>
    )
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
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
