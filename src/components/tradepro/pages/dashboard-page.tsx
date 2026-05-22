'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Flame,
  Zap,
  ChevronRight,
  Search,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { IndexDetailDrawer } from '@/components/tradepro/index-detail-drawer'
import { motion } from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────

interface IndexData {
  id: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  open?: number
  high?: number
  low?: number
  previousClose?: number
  volume?: number
  isEnabled: boolean
}

interface StockData {
  id: string
  symbol: string
  name: string
  sector: string
  currentPrice: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  isFuturesAvailable: boolean
  isOptionsAvailable: boolean
}

// ─── Fallback Data ──────────────────────────────────────────────────────────

const fallbackIndices: IndexData[] = [
  { id: '1', symbol: 'NIFTY', name: 'NIFTY 50', currentPrice: 22356.10, change: 142.30, changePercent: 0.64, isEnabled: true },
  { id: '2', symbol: 'SENSEX', name: 'SENSEX', currentPrice: 73645.25, change: 450.15, changePercent: 0.61, isEnabled: true },
  { id: '3', symbol: 'BANKNIFTY', name: 'BANK NIFTY', currentPrice: 47210.45, change: -82.10, changePercent: -0.17, isEnabled: true },
  { id: '4', symbol: 'FINNIFTY', name: 'FIN NIFTY', currentPrice: 23450.80, change: 95.60, changePercent: 0.41, isEnabled: true },
  { id: '5', symbol: 'MIDCPNIFTY', name: 'NIFTY MIDCAP', currentPrice: 12450.30, change: -32.40, changePercent: -0.26, isEnabled: true },
]

const fallbackStocks: StockData[] = [
  { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', currentPrice: 2890.50, change: 34.25, changePercent: 1.20, marketCap: 1958000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '2', symbol: 'TCS', name: 'Tata Consultancy', sector: 'IT', currentPrice: 3945.00, change: -22.30, changePercent: -0.56, marketCap: 1430000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', currentPrice: 1642.75, change: 18.50, changePercent: 1.14, marketCap: 1250000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '4', symbol: 'INFY', name: 'Infosys', sector: 'IT', currentPrice: 1578.30, change: -8.70, changePercent: -0.55, marketCap: 655000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '5', symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', currentPrice: 1124.60, change: 12.40, changePercent: 1.12, marketCap: 790000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '6', symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', currentPrice: 2345.80, change: -15.20, changePercent: -0.64, marketCap: 552000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '7', symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', currentPrice: 628.45, change: 8.75, changePercent: 1.41, marketCap: 561000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '8', symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', currentPrice: 1520.30, change: 22.80, changePercent: 1.52, marketCap: 895000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '9', symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', currentPrice: 438.65, change: -3.10, changePercent: -0.70, marketCap: 548000, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '10', symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', currentPrice: 1785.20, change: 9.60, changePercent: 0.54, marketCap: 354000, isFuturesAvailable: true, isOptionsAvailable: true },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatVolume(value: number | undefined): string {
  if (!value) return '-'
  if (value >= 10000000) return (value / 10000000).toFixed(2) + 'Cr'
  if (value >= 100000) return (value / 100000).toFixed(2) + 'L'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
  return value.toString()
}

function formatMarketCap(value: number | undefined): string {
  if (!value) return '-'
  if (value >= 100000) return '₹' + (value / 100000).toFixed(2) + 'L Cr'
  if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + 'K Cr'
  return '₹' + value + ' Cr'
}

// ─── Animation ──────────────────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { navigateToStock } = useAppStore()

  // Index detail drawer
  const [selectedIndexSymbol, setSelectedIndexSymbol] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleIndexClick = (symbol: string) => {
    setSelectedIndexSymbol(symbol)
    setDrawerOpen(true)
  }

  // Data states
  const [marketIndices, setMarketIndices] = useState<IndexData[]>([])
  const [stocks, setStocks] = useState<StockData[]>([])
  const [gainers, setGainers] = useState<StockData[]>([])
  const [losers, setLosers] = useState<StockData[]>([])
  const [stockTab, setStockTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Loading
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [stocksLoading, setStocksLoading] = useState(true)
  const [gainersLoading, setGainersLoading] = useState(true)
  const [losersLoading, setLosersLoading] = useState(true)

  // ─── Fetch Indices ───────────────────────────────────────────
  const fetchIndices = useCallback(async () => {
    try {
      setIndicesLoading(true)
      const res = await fetch('/api/indices')
      if (res.ok) {
        const json = await res.json()
        setMarketIndices(json.data?.length > 0 ? json.data : fallbackIndices)
      } else {
        setMarketIndices(fallbackIndices)
      }
    } catch {
      setMarketIndices(fallbackIndices)
    } finally {
      setIndicesLoading(false)
    }
  }, [])

  // ─── Fetch Stocks ────────────────────────────────────────────
  const fetchStocks = useCallback(async () => {
    try {
      setStocksLoading(true)
      const res = await fetch('/api/stocks')
      if (res.ok) {
        const json = await res.json()
        setStocks(json.data?.length > 0 ? json.data : fallbackStocks)
      } else {
        setStocks(fallbackStocks)
      }
    } catch {
      setStocks(fallbackStocks)
    } finally {
      setStocksLoading(false)
    }
  }, [])

  // ─── Fetch Gainers ───────────────────────────────────────────
  const fetchGainers = useCallback(async () => {
    try {
      setGainersLoading(true)
      const res = await fetch('/api/stocks/gainers')
      if (res.ok) {
        const json = await res.json()
        setGainers(json.data?.length > 0 ? json.data : [])
      } else {
        setGainers([])
      }
    } catch {
      setGainers([])
    } finally {
      setGainersLoading(false)
    }
  }, [])

  // ─── Fetch Losers ────────────────────────────────────────────
  const fetchLosers = useCallback(async () => {
    try {
      setLosersLoading(true)
      const res = await fetch('/api/stocks/losers')
      if (res.ok) {
        const json = await res.json()
        setLosers(json.data?.length > 0 ? json.data : [])
      } else {
        setLosers([])
      }
    } catch {
      setLosers([])
    } finally {
      setLosersLoading(false)
    }
  }, [])

  // ─── Load all data ───────────────────────────────────────────
  useEffect(() => {
    fetchIndices()
    fetchStocks()
    fetchGainers()
    fetchLosers()
  }, [fetchIndices, fetchStocks, fetchGainers, fetchLosers])

  // ─── Listen for index detail events from ticker ────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.symbol) handleIndexClick(detail.symbol)
    }
    window.addEventListener('openIndexDetail', handler)
    return () => window.removeEventListener('openIndexDetail', handler)
  }, [])

  // ─── Derived: filtered stocks based on tab + search ─────────
  const displayIndices = marketIndices.length > 0 ? marketIndices : fallbackIndices

  const getFilteredStocks = () => {
    let list: StockData[] = stocks.length > 0 ? stocks : fallbackStocks
    if (stockTab === 'gainers') list = gainers.length > 0 ? gainers : list.filter(s => s.changePercent > 0)
    else if (stockTab === 'losers') list = losers.length > 0 ? losers : list.filter(s => s.changePercent < 0)
    else if (stockTab === 'fno') list = list.filter(s => s.isFuturesAvailable && s.isOptionsAvailable)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    }
    return list.slice(0, 20)
  }

  // ─── Market status ──────────────────────────────────────────
  const isMarketOpen = () => {
    const now = new Date()
    const day = now.getDay()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const time = hours * 60 + minutes
    // Mon-Fri, 9:15 AM - 3:30 PM IST
    return day >= 1 && day <= 5 && time >= 555 && time <= 930
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* ═══ MARKET OVERVIEW HEADER ═════════════════════════════════════════ */}
      <motion.div {...fadeIn}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
            Market Overview
          </h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isMarketOpen() ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'bg-[#6b7280]/10 text-[#6b7280]'
            }`}>
              <span className={`size-1.5 rounded-full ${isMarketOpen() ? 'bg-[#00d09c] animate-pulse' : 'bg-[#6b7280]'}`} />
              {isMarketOpen() ? 'MARKET OPEN' : 'MARKET CLOSED'}
            </span>
            <span className="text-xs font-medium text-[#6b7280] bg-white border border-[#e5e7eb] px-2.5 py-1 rounded-lg">
              NSE
            </span>
          </div>
        </div>
        <p className="text-sm text-[#6b7280]">Indian Stock Market Live Updates</p>
      </motion.div>

      {/* ═══ ALL INDICES ════════════════════════════════════════════════════ */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Activity className="size-5 text-[#00D09C]" />
            Indices
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {indicesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-3 w-16 mb-2 bg-[#f5f5f5]" />
                  <Skeleton className="h-6 w-24 mb-1.5 bg-[#f5f5f5]" />
                  <Skeleton className="h-3 w-20 bg-[#f5f5f5]" />
                </CardContent>
              </Card>
            ))
          ) : (
            displayIndices.map((index, i) => {
              const isPositive = index.changePercent >= 0
              return (
                <motion.div
                  key={index.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                >
                  <Card
                    onClick={() => handleIndexClick(index.symbol)}
                    className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md hover:border-[#00D09C]/30 transition-all cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#6b7280] tracking-wider uppercase">
                          {index.name || index.symbol}
                        </span>
                        {isPositive ? (
                          <TrendingUp className="size-4 text-[#00d09c] group-hover:scale-110 transition-transform" />
                        ) : (
                          <TrendingDown className="size-4 text-[#eb5b3c] group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div className="text-xl font-bold font-mono-data text-[#1a1a1a] mb-0.5">
                        {formatPrice(index.currentPrice)}
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                        {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        <span>{isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* ═══ STOCKS SECTION ═════════════════════════════════════════════════ */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 pb-0 gap-3">
              <h3 className="text-lg font-semibold text-[#1a1a1a] flex items-center gap-2">
                <BarChart3 className="size-5 text-[#00D09C]" />
                Stocks
              </h3>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#6b7280]" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm bg-[#f5f7fa] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#00D09C]/50 focus:ring-1 focus:ring-[#00D09C]/20 w-full sm:w-56 transition-all"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-3">
              <Tabs value={stockTab} onValueChange={setStockTab}>
                <TabsList className="bg-[#f5f7fa] h-9 p-1 rounded-lg">
                  <TabsTrigger value="all" className="text-xs font-semibold px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1a1a1a]">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="gainers" className="text-xs font-semibold px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#00d09c]">
                    <Flame className="size-3 mr-1" />
                    Gainers
                  </TabsTrigger>
                  <TabsTrigger value="losers" className="text-xs font-semibold px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#eb5b3c]">
                    <TrendingDown className="size-3 mr-1" />
                    Losers
                  </TabsTrigger>
                  <TabsTrigger value="fno" className="text-xs font-semibold px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1a1a1a]">
                    F&O
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Stock List */}
            <div className="p-5">
              {stocksLoading && stockTab === 'all' ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-lg bg-[#f5f5f5]" />
                        <div>
                          <Skeleton className="h-4 w-20 bg-[#f5f5f5] mb-1" />
                          <Skeleton className="h-3 w-28 bg-[#f5f5f5]" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 bg-[#f5f5f5] mb-1 ml-auto" />
                        <Skeleton className="h-3 w-12 bg-[#f5f5f5] ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (stockTab === 'gainers' && gainersLoading) || (stockTab === 'losers' && losersLoading) ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-lg bg-[#f5f5f5]" />
                        <div>
                          <Skeleton className="h-4 w-20 bg-[#f5f5f5] mb-1" />
                          <Skeleton className="h-3 w-28 bg-[#f5f5f5]" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 bg-[#f5f5f5] mb-1 ml-auto" />
                        <Skeleton className="h-3 w-12 bg-[#f5f5f5] ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : getFilteredStocks().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="size-12 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-3">
                    <BarChart3 className="size-6 text-[#6b7280]/40" />
                  </div>
                  <p className="text-[#1a1a1a] font-semibold text-sm">
                    {searchQuery ? `No stocks found for "${searchQuery}"` : 'No stocks available'}
                  </p>
                  <p className="text-[#6b7280] text-xs mt-1">Stock data will appear when available</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0f0f0]">
                  {getFilteredStocks().map((stock, i) => {
                    const isPositive = stock.changePercent >= 0
                    return (
                      <motion.div
                        key={stock.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.02 * i }}
                        onClick={() => navigateToStock(stock.symbol)}
                        className="flex items-center justify-between py-3 px-1 hover:bg-[#f5f7fa] rounded-lg cursor-pointer transition-colors group"
                      >
                        {/* Left: Symbol + Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isPositive ? 'bg-[#00d09c]/8' : 'bg-[#eb5b3c]/8'
                          }`}>
                            <span className={`text-xs font-bold ${isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                              {stock.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[#1a1a1a] truncate">{stock.symbol}</span>
                              {stock.isFuturesAvailable && stock.isOptionsAvailable && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-bold border-[#00D09C]/30 text-[#00D09C] bg-[#00D09C]/5">
                                  F&O
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6b7280] truncate">{stock.name} • {stock.sector}</p>
                          </div>
                        </div>

                        {/* Right: Price + Change */}
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm font-bold font-mono-data text-[#1a1a1a]">
                            ₹{formatPrice(stock.currentPrice)}
                          </div>
                          <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                            isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'
                          }`}>
                            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isPositive ? 'bg-[#00d09c]/10' : 'bg-[#eb5b3c]/10'
                            }`}>
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="size-4 text-[#d1d5db] group-hover:text-[#6b7280] ml-1 shrink-0 transition-colors" />
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ MARKET INSIGHTS ═════════════════════════════════════════════════ */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Top Gainers Summary */}
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-[#00d09c]/10 flex items-center justify-center">
                  <Flame className="size-4 text-[#00d09c]" />
                </div>
                <h4 className="font-semibold text-[#1a1a1a] text-sm">Top Gainers</h4>
              </div>
              <div className="space-y-2.5">
                {(gainers.length > 0 ? gainers : fallbackStocks.filter(s => s.changePercent > 0)).slice(0, 4).map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between cursor-pointer hover:bg-[#f5f7fa] rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => navigateToStock(s.symbol)}>
                    <span className="text-xs font-semibold text-[#1a1a1a]">{s.symbol}</span>
                    <span className="text-xs font-bold text-[#00d09c]">+{s.changePercent.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Losers Summary */}
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-[#eb5b3c]/10 flex items-center justify-center">
                  <TrendingDown className="size-4 text-[#eb5b3c]" />
                </div>
                <h4 className="font-semibold text-[#1a1a1a] text-sm">Top Losers</h4>
              </div>
              <div className="space-y-2.5">
                {(losers.length > 0 ? losers : fallbackStocks.filter(s => s.changePercent < 0)).slice(0, 4).map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between cursor-pointer hover:bg-[#f5f7fa] rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => navigateToStock(s.symbol)}>
                    <span className="text-xs font-semibold text-[#1a1a1a]">{s.symbol}</span>
                    <span className="text-xs font-bold text-[#eb5b3c]">{s.changePercent.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* F&O Stocks */}
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                  <Zap className="size-4 text-[#6366f1]" />
                </div>
                <h4 className="font-semibold text-[#1a1a1a] text-sm">F&O Stocks</h4>
              </div>
              <div className="space-y-2.5">
                {(stocks.length > 0 ? stocks : fallbackStocks).filter(s => s.isFuturesAvailable && s.isOptionsAvailable).slice(0, 4).map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between cursor-pointer hover:bg-[#f5f7fa] rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => navigateToStock(s.symbol)}>
                    <span className="text-xs font-semibold text-[#1a1a1a]">{s.symbol}</span>
                    <span className={`text-xs font-bold ${s.changePercent >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ═══ Index Detail Drawer ════════════════════════════════════════════════ */}
      <IndexDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        symbol={selectedIndexSymbol}
      />
    </div>
  )
}
