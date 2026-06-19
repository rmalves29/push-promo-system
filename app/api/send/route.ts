import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabase } from '@/lib/supabase'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { title, body, url } = await req.json()

  if (!title || !body) {
    return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
  }

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('endpoint, p256dh, auth')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Salva a campanha primeiro para obter o ID (usado no tracking de cliques)
  const { data: campaign } = await supabase
    .from('campaigns')
    .insert({ title, body, url, recipients: 0, failed: 0, clicks: 0, unsubscribed: 0 })
    .select('id')
    .single()

  const campaignId = campaign?.id

  // URL de tracking de clique
  const trackingUrl = campaignId
    ? `https://push-promo-system.vercel.app/api/track/click?cid=${campaignId}&url=${encodeURIComponent(url || '/')}`
    : url || '/'

  const payload = JSON.stringify({ title, body, url: trackingUrl })

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (
      result.status === 'rejected' &&
      (result.reason as { statusCode?: number })?.statusCode === 410
    ) {
      expiredEndpoints.push(subscribers[i].endpoint)
    }
  })

  if (expiredEndpoints.length > 0) {
    await supabase.from('subscribers').delete().in('endpoint', expiredEndpoints)
  }

  // Atualiza campanha com estatísticas reais
  if (campaignId) {
    await supabase.from('campaigns').update({
      recipients: sent,
      failed,
      unsubscribed: expiredEndpoints.length,
    }).eq('id', campaignId)
  }

  return NextResponse.json({ sent, failed, unsubscribed: expiredEndpoints.length })
}
