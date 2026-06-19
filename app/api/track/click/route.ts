import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cid = searchParams.get('cid')
  const url = searchParams.get('url') || '/'

  if (cid) {
    const { data } = await supabase.from('campaigns').select('clicks').eq('id', cid).single()
    await supabase.from('campaigns').update({ clicks: (data?.clicks || 0) + 1 }).eq('id', cid)
  }

  return NextResponse.redirect(url)
}
