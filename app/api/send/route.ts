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

  const payload = JSON.stringify({ title, body, url: url || '/' })

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  // Remove subscribers that returned 410 Gone (unsubscribed)
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

  // Save campaign to history
  await supabase.from('campaigns').insert({ title, body, url, recipients: sent })

  return NextResponse.json({ sent, failed })
}
