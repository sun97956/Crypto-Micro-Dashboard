import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { CryptoChartData } from '@/lib/types'

const CG_API_KEY = process.env.COINGECKO_API_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') ?? '30'

  // 验证参数合法性
  if (!['7', '30', '90'].includes(days)) {
    return NextResponse.json({ error: 'Invalid days param', code: 400 }, { status: 400 })
  }

  try {
    const url = `https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
    const res = await upstreamFetch(url, {
      headers: { 'x-cg-pro-api-key': CG_API_KEY },
    })
    const json = await res.json()

    // CoinGecko 返回 [[timestamp_ms, price], ...]
    const data: CryptoChartData = json.prices.map(
      ([ts, price]: [number, number]) => ({
        date: new Date(ts).toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      })
    )

    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=300, must-revalidate' } }
    )
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, code: 500 },
      { status: 500 }
    )
  }
}
