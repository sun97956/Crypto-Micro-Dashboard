import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { DominanceData } from '@/lib/types'

const CG_API_KEY = process.env.COINGECKO_API_KEY!

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '90', 10)

    const [btcRes, ethRes, globalRes] = await Promise.all([
      upstreamFetch(
        `https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`,
        { headers: { 'x-cg-pro-api-key': CG_API_KEY } }
      ),
      upstreamFetch(
        `https://pro-api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}&interval=daily`,
        { headers: { 'x-cg-pro-api-key': CG_API_KEY } }
      ),
      upstreamFetch(
        `https://pro-api.coingecko.com/api/v3/global/market_cap_chart?days=${days}`,
        { headers: { 'x-cg-pro-api-key': CG_API_KEY } }
      ),
    ])

    const btcJson = await btcRes.json()
    const ethJson = await ethRes.json()
    const globalJson = await globalRes.json()

    const btcCaps: [number, number][] = btcJson.market_caps
    const ethCaps: [number, number][] = ethJson.market_caps
    const totalCaps: [number, number][] = globalJson.market_cap_chart.market_cap

    // 以 total market cap 的时间戳为基准，匹配最近的 BTC/ETH 数据点
    const btcMap = new Map(btcCaps.map(([ts, v]) => [Math.round(ts / 86400000), v]))
    const ethMap = new Map(ethCaps.map(([ts, v]) => [Math.round(ts / 86400000), v]))

    const data: DominanceData = totalCaps
      .map(([ts, total]) => {
        const dayKey = Math.round(ts / 86400000)
        const btc = btcMap.get(dayKey) ?? btcMap.get(dayKey - 1) ?? btcMap.get(dayKey + 1)
        const eth = ethMap.get(dayKey) ?? ethMap.get(dayKey - 1) ?? ethMap.get(dayKey + 1)
        if (!btc || !eth || !total) return null
        return {
          date: new Date(ts).toISOString().slice(0, 10),
          btcDominance: parseFloat(((btc / total) * 100).toFixed(2)),
          ethDominance: parseFloat(((eth / total) * 100).toFixed(2)),
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)

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
