'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

interface IndexData {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

interface MarketStatus {
  status: string
  message: string
  istTime: string
}

export function IndexTicker() {
  const [indices, setIndices] = useState<IndexData[]>([])
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [indicesRes, statusRes] = await Promise.all([
          fetch('/api/indices'),
          fetch('/api/market/status'),
        ])
        const indicesData = await indicesRes.json()
        const statusData = await statusRes.json()
        if (indicesData.success) setIndices(indicesData.data)
        if (statusData.success) setMarketStatus(statusData.data)
      } catch {
        // Fallback to mock data
        setIndices([
          { symbol: 'NIFTY', name: 'NIFTY 50', currentPrice: 19500, change: 125.30, changePercent: 0.65 },
          { symbol: 'BANKNIFTY', name: 'BANK NIFTY', currentPrice: 44250, change: -210.45, changePercent: -0.47 },
          { symbol: 'SENSEX', name: 'SENSEX', currentPrice: 65200, change: 340.20, changePercent: 0.52 },
          { symbol: 'FINNIFTY', name: 'FINNIFTY', currentPrice: 20150, change: 85.75, changePercent: 0.43 },
          { symbol: 'MIDCPNIFTY', name: 'MIDCAP NIFTY', currentPrice: 12500, change: 40.10, changePercent: 0.32 },
        ])
        setMarketStatus({ status: 'CLOSED', message: 'Market closed', istTime: new Date().toISOString() })
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const isOpen = marketStatus?.status === 'OPEN'
  const isPreOpen = marketStatus?.status === 'PRE-OPEN'

  return (
    <div className="fixed left-0 right-0 top-[56px] z-20 md:left-[280px]">
      <div className="bg-[#111827] border-b border-[#1f2937]">
        <div className="flex items-center h-8 px-3 gap-3 overflow-x-auto custom-scrollbar">
          {/* Market Status Badge */}
          <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-[#1f2937]">
            <div className={`flex items-center gap-1 ${isOpen ? 'text-emerald-400' : isPreOpen ? 'text-amber-400' : 'text-red-400'}`}>
              <Activity className="size-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {marketStatus?.status || 'CLOSED'}
              </span>
              {isOpen && (
                <span className="flex size-1.5">
                  <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
            </div>
          </div>

          {/* Index Ticker */}
          <div className="flex items-center gap-4 overflow-x-auto">
            {indices.map((idx) => {
              const isPositive = idx.change >= 0
              return (
                <div
                  key={idx.symbol}
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-amber-500/10 px-1.5 py-0.5 rounded transition-colors"
                  onClick={() => {
                    // Dispatch a custom event that the dashboard listens to
                    window.dispatchEvent(new CustomEvent('openIndexDetail', { detail: { symbol: idx.symbol } }))
                  }}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-amber-400 transition-colors">
                    {idx.symbol}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-white">
                    {idx.currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                    {isPositive ? '+' : ''}{idx.change.toFixed(2)} ({isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
