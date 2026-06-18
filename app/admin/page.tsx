'use client'

import { useState, useEffect } from 'react'

interface Campaign {
  id: string
  title: string
  body: string
  sent_at: string
  recipients: number
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuth(true)
      loadDashboard()
    } else {
      setAuthError('Senha incorreta.')
    }
  }

  async function loadDashboard() {
    const [subsRes, campRes] = await Promise.all([
      fetch('/api/admin/subscribers'),
      fetch('/api/admin/campaigns'),
    ])
    if (subsRes.ok) {
      const data = await subsRes.json()
      setSubscriberCount(data.count)
    }
    if (campRes.ok) {
      const data = await campRes.json()
      setCampaigns(data.campaigns)
    }
  }

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: `Enviado para ${data.sent} clientes!` })
        setTitle('')
        setBody('')
        setUrl('')
        loadDashboard()
      } else {
        setResult({ error: data.error || 'Erro ao enviar.' })
      }
    } catch {
      setResult({ error: 'Erro de conexão.' })
    } finally {
      setSending(false)
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <div className="text-4xl text-center mb-4">🔐</div>
          <h1 className="text-xl font-bold text-center text-gray-800 mb-6">Painel Admin</h1>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📣 Painel de Promoções</h1>
            <p className="text-gray-500 text-sm">Envie notificações push para seus clientes</p>
          </div>
          {subscriberCount !== null && (
            <div className="text-center bg-indigo-50 rounded-xl px-4 py-2">
              <p className="text-2xl font-bold text-indigo-600">{subscriberCount}</p>
              <p className="text-xs text-gray-500">inscritos</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nova Promoção</h2>
          <form onSubmit={sendNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
              <input
                type="text"
                placeholder="Ex: 🔥 50% OFF hoje!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mensagem</label>
              <textarea
                placeholder="Ex: Aproveite nossa promoção relâmpago por tempo limitado!"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Link ao clicar <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="url"
                placeholder="https://seusite.com/promocao"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {result?.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                ✅ {result.success}
              </div>
            )}
            {result?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                ❌ {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {sending ? 'Enviando...' : '🚀 Enviar para todos os clientes'}
            </button>
          </form>
        </div>

        {/* Histórico */}
        {campaigns.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Histórico de Envios</h2>
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{c.title}</p>
                      <p className="text-sm text-gray-500">{c.body}</p>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {c.recipients} enviados
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(c.sent_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
