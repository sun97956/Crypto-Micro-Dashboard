import { NextResponse } from 'next/server'
import { upstreamFetch } from '@/lib/upstream'
import type { M2BtcData } from '@/lib/types'

const CG_API_KEY = process.env.COINGECKO_API_KEY!
const FRED_API_KEY = process.env.FRED_API_KEY!

// 2020-01-01 的 Unix 时间戳（秒）
const START_TS = Math.floor(new Date('2020-01-01').getTime() / 1000)
const NOW_TS = Math.floor(Date.now() / 1000)

async function fetchBtcDaily(): Promise<Map<string, number>> {
  const url = `https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${START_TS}&to=${NOW_TS}`
  const res = await upstreamFetch(url, {
    headers: { 'x-cg-pro-api-key': CG_API_KEY },
  })
  const json = await res.json()

  // 按日期取最后一个数据点
  const dayMap = new Map<string, number>()
  for (const [ts, price] of json.prices as [number, number][]) {
    const day = new Date(ts).toISOString().slice(0, 10) // "2020-01-15"
    dayMap.set(day, Math.round(price))
  }
  return dayMap
}

async function fetchM2Weekly(): Promise<Map<string, number>> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=WM2NS&api_key=${FRED_API_KEY}&file_type=json&observation_start=2020-01-01`
  const res = await upstreamFetch(url)
  const json = await res.json()

  const dateMap = new Map<string, number>()
  for (const obs of json.observations as { date: string; value: string }[]) {
    if (obs.value !== '.') {
      dateMap.set(obs.date, parseFloat(obs.value))
    }
  }
  return dateMap
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '365', 10)

    const [btcMap, m2Map] = await Promise.all([fetchBtcDaily(), fetchM2Weekly()])

    // 对每个 M2 周度日期，找最近的 BTC 价格（±3天容差）
    const btcDates = Array.from(btcMap.keys()).sort()
    const nearestBtc = (dateStr: string): number | null => {
      const ts = new Date(dateStr).getTime()
      for (let delta = 0; delta <= 3; delta++) {
        for (const sign of [0, 1, -1]) {
          const d = new Date(ts + sign * delta * 86400000).toISOString().slice(0, 10)
          if (btcMap.has(d)) return btcMap.get(d)!
        }
      }
      // fallback: pick closest btcDate
      let best: string | null = null
      let bestDiff = Infinity
      for (const d of btcDates) {
        const diff = Math.abs(new Date(d).getTime() - ts)
        if (diff < bestDiff) { bestDiff = diff; best = d }
      }
      return best ? btcMap.get(best)! : null
    }

    // M2 周度数据有约 4-6 周滞后，用周数截取而非绝对日期
    const weekCount = Math.ceil(days / 7)
    let dates = Array.from(m2Map.keys()).sort()
    if (dates.length > weekCount) {
      dates = dates.slice(-weekCount)
    }

    const data: M2BtcData = dates
      .map((date) => {
        const btc = nearestBtc(date)
        if (!btc) return null
        return { month: date, btc, m2: m2Map.get(date)! }
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
