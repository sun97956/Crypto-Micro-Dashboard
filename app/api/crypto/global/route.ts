import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { CryptoGlobalData } from '@/lib/types'

const CMC_API_KEY = process.env.CMC_API_KEY!

export async function GET() {
  try {
    const res = await upstreamFetch(
      'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest',
      { headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY } }
    )
    const json = await res.json()
    const d = json.data

    const data: CryptoGlobalData = {
      totalMarketCap: d.quote.USD.total_market_cap,
      totalMarketCapChange24h: d.quote.USD.total_market_cap_yesterday_percentage_change,
      btcDominance: d.btc_dominance,
      ethDominance: d.eth_dominance,
      stablecoinMarketCap: d.quote.USD.stablecoin_market_cap,
    }

    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, code: 500 },
      { status: 500 }
    )
  }
}
