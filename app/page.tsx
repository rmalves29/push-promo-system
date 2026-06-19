'use client'

import { useEffect, useState, useRef } from 'react'

function isIos() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone === true
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showIosGuide, setShowIosGuide] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    // Captura o evento de instalação do PWA no Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS fora do modo standalone → mostra guia
    if (isIos() && !isInStandaloneMode()) {
      setShowIosGuide(true)
      return
    }

    // Auto-subscribe se ?push=1 na URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('auto') === '1' || params.get('push') === '1') {
      subscribe()
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // Android com PWA não instalado — tenta instalar primeiro
      if (deferredPrompt.current) {
        await deferredPrompt.current.prompt()
        const { outcome } = await deferredPrompt.current.userChoice
        if (outcome === 'dismissed') {
          setStatus('error')
          setMessage('Instale o app para receber as notificações.')
          return
        }
        deferredPrompt.current = null
        setMessage('App instalado! Agora ative as notificações abrindo o app.')
        setStatus('subscribed')
        return
      }
      setStatus('error')
      setMessage('Seu navegador não suporta notificações push.')
      return
    }

    // Se tem prompt de instalação pendente no Android, instala primeiro
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      deferredPrompt.current = null
      if (outcome === 'dismissed') {
        // Continua mesmo assim — pode funcionar sem instalar no Android
      }
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

  // Guia para iOS
  if (showIosGuide) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Instale o app para receber promoções
          </h1>
          <p className="text-gray-500 mb-6">
            No iPhone/iPad, siga os passos abaixo:
          </p>
          <div className="text-left space-y-4 mb-6">
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold text-gray-700">Toque em Compartilhar</p>
                <p className="text-sm text-gray-500">Ícone <span className="font-bold">□↑</span> na barra inferior do Safari</p>
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
          <p className="text-xs text-gray-400">Requer iOS 16.4 ou superior</p>
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
