import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { CryptoPricesData } from '@/lib/types'

const CMC_API_KEY = process.env.CMC_API_KEY!

// BTC/ETH/SOL/BNB/XRP queried by symbol; HYPE by CMC ID (32196) to avoid symbol conflicts
const SYMBOL_LIST = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']
const HYPE_ID = '32196'

const NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  XRP: 'XRP',
  HYPE: 'Hyperliquid',
}

export async function GET() {
  try {
    const [resSymbols, resHype] = await Promise.all([
      upstreamFetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${SYMBOL_LIST.join(',')}&convert=USD`,
        { headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY } }
      ),
      upstreamFetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${HYPE_ID}&convert=USD`,
        { headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY } }
      ),
    ])

    const jsonSymbols = await resSymbols.json()
    const jsonHype = await resHype.json()

    const data: CryptoPricesData = [
      ...SYMBOL_LIST.map((symbol) => {
        const coin = jsonSymbols.data[symbol]
        const q = coin.quote.USD
        return {
          symbol,
          name: NAMES[symbol] ?? symbol,
          price: q.price,
          change24h: q.percent_change_24h,
          change7d: q.percent_change_7d,
          marketCap: q.market_cap,
        }
      }),
      (() => {
        const coin = jsonHype.data[HYPE_ID]
        const q = coin.quote.USD
        return {
          symbol: 'HYPE',
          name: 'Hyperliquid',
          price: q.price,
          change24h: q.percent_change_24h,
          change7d: q.percent_change_7d,
          marketCap: q.market_cap,
        }
      })(),
    ]

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
