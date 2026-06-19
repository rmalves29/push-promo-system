import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, count, error } = await supabase
    .from('subscribers')
    .select('id, label, origin, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0, subscribers: data })
}
