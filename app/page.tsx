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
  const [name, setName] = useState('')
  const [autoName, setAutoName] = useState('')
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Captura nome e origem da URL (ex: ?name=João&origem=manychat&push=1)
    const params = new URLSearchParams(window.location.search)
    const urlName = params.get('name') || params.get('nome') || ''
    const urlOrigin = params.get('origem') || params.get('origin') || ''
    if (urlName) setAutoName(urlName)

    if (isIos() && !isInStandaloneMode()) {
      setShowIosGuide(true)
      return
    }

    if (params.get('auto') === '1' || params.get('push') === '1') {
      subscribe(urlName, urlOrigin)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function subscribe(labelOverride?: string, originOverride?: string) {
    const label = labelOverride || name || autoName || null
    const origin = originOverride || new URLSearchParams(window.location.search).get('origem') || new URLSearchParams(window.location.search).get('origin') || null

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (deferredPrompt.current) {
        await deferredPrompt.current.prompt()
        const { outcome } = await deferredPrompt.current.userChoice
        deferredPrompt.current = null
        if (outcome === 'dismissed') {
          setStatus('error')
          setMessage('Instale o app para receber as notificações.')
          return
        }
        setStatus('subscribed')
        setMessage('App instalado! Abra o app para ativar as notificações.')
        return
      }
      setStatus('error')
      setMessage('Seu navegador não suporta notificações push.')
      return
    }

    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      deferredPrompt.current = null
      if (outcome === 'dismissed') { /* continua mesmo assim */ }
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
      const sub = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, label, origin }),
      })

      if (res.ok) {
        setStatus('subscribed')
        setMessage(`Inscrito com sucesso!${label ? ` Olá, ${label}!` : ''} Você receberá nossas promoções.`)
      } else {
        throw new Error('Falha ao salvar inscrição')
      }
    } catch {
      setStatus('error')
      setMessage('Erro ao se inscrever. Verifique as permissões do navegador.')
    }
  }

  if (showIosGuide) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Instale o app para receber promoções</h1>
          <p className="text-gray-500 mb-6">No iPhone/iPad, siga os passos abaixo:</p>
          <div className="text-left space-y-4 mb-6">
            {[
              { n: '1️⃣', t: 'Toque em Compartilhar', d: 'Ícone □↑ na barra inferior do Safari' },
              { n: '2️⃣', t: 'Adicionar à Tela de Início', d: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
              { n: '3️⃣', t: 'Abra pelo ícone instalado', d: 'Feche o Safari e abra o app pela tela inicial' },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-2xl">{step.n}</span>
                <div>
                  <p className="font-semibold text-gray-700">{step.t}</p>
                  <p className="text-sm text-gray-500">{step.d}</p>
                </div>
              </div>
            ))}
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
          {autoName ? `Olá, ${autoName}! 👋` : 'Receba nossas Promoções'}
        </h1>
        <p className="text-gray-500 mb-6">
          Ative as notificações e seja o primeiro a saber sobre nossas ofertas exclusivas!
        </p>

        {status === 'subscribed' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            ✅ {message}
          </div>
        ) : status === 'error' ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
            ❌ {message}
          </div>
        ) : (
          <div className="space-y-3">
            {!autoName && (
              <input
                type="text"
                placeholder="Seu nome (opcional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            )}
            <button
              onClick={() => subscribe()}
              disabled={status === 'loading'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              {status === 'loading' ? 'Ativando...' : '🔔 Ativar Notificações'}
            </button>
          </div>
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
