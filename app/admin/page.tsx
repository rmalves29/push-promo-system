'use client'

import { useState, useEffect } from 'react'

interface Campaign {
  id: string
  title: string
  body: string
  url: string
  sent_at: string
  recipients: number
  failed: number
  clicks: number
  unsubscribed: number
}

interface Subscriber {
  id: string
  label: string | null
  origin: string | null
  created_at: string
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<'send' | 'campaigns' | 'subscribers'>('send')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
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
      setSubscribers(data.subscribers || [])
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
        setResult({ success: `✅ Enviado para ${data.sent} clientes! ${data.failed > 0 ? `(${data.failed} falhas)` : ''}` })
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

  function clickRate(c: Campaign) {
    if (!c.recipients || c.recipients === 0) return '0%'
    return ((c.clicks / c.recipients) * 100).toFixed(1) + '%'
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
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors">
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">📣 Painel de Promoções</h1>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2 text-center">
            <p className="text-xl font-bold text-indigo-600">{subscriberCount ?? '—'}</p>
            <p className="text-xs text-gray-500">inscritos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 border-t">
          {(['send', 'campaigns', 'subscribers'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'send' ? '🚀 Enviar' : t === 'campaigns' ? '📊 Relatórios' : '👥 Inscritos'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">

        {/* ABA: ENVIAR */}
        {tab === 'send' && (
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
              {result?.success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">{result.success}</div>}
              {result?.error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">❌ {result.error}</div>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {sending ? 'Enviando...' : `🚀 Enviar para todos os ${subscriberCount ?? ''} inscritos`}
              </button>
            </form>
          </div>
        )}

        {/* ABA: RELATÓRIOS */}
        {tab === 'campaigns' && (
          <div className="space-y-4">
            {/* Totais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total de Campanhas', value: campaigns.length, color: 'indigo' },
                { label: 'Total Enviados', value: campaigns.reduce((a, c) => a + (c.recipients || 0), 0), color: 'green' },
                { label: 'Total de Cliques', value: campaigns.reduce((a, c) => a + (c.clicks || 0), 0), color: 'blue' },
                { label: 'Cancelamentos', value: campaigns.reduce((a, c) => a + (c.unsubscribed || 0), 0), color: 'red' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl shadow p-4 text-center">
                  <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Lista de campanhas */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-700">Histórico de Campanhas</h2>
              </div>
              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhuma campanha enviada ainda.</div>
              ) : (
                <div className="divide-y">
                  {campaigns.map((c) => (
                    <div key={c.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{c.title}</p>
                          <p className="text-sm text-gray-500">{c.body}</p>
                          {c.url && <p className="text-xs text-indigo-500 mt-1 truncate">{c.url}</p>}
                        </div>
                        <p className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                          {new Date(c.sent_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-green-600">{c.recipients || 0}</p>
                          <p className="text-xs text-gray-500">Enviados</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-blue-600">{c.clicks || 0}</p>
                          <p className="text-xs text-gray-500">Cliques</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-purple-600">{clickRate(c)}</p>
                          <p className="text-xs text-gray-500">CTR</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-red-500">{c.unsubscribed || 0}</p>
                          <p className="text-xs text-gray-500">Cancelaram</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: INSCRITOS */}
        {tab === 'subscribers' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Lista de Inscritos</h2>
              <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
                {subscriberCount ?? 0} total
              </span>
            </div>
            {subscribers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Nenhum inscrito ainda.</div>
            ) : (
              <div className="divide-y">
                {subscribers.map((s, i) => (
                  <div key={s.id} className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{s.label || 'Inscrito anônimo'}</p>
                      <p className="text-xs text-gray-400">
                        {s.origin ? `Origem: ${s.origin} · ` : ''}
                        Inscrito em {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
