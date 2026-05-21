'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  X,
  BarChart3,
  GitBranch,
  Activity,
  Target,
  Shield,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface IndexDetail {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: number
  week52High: number
  week52Low: number
  lotSize: number
  strikeInterval: number
  isRealData?: boolean
}

interface CandleData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface OptionRow {
  strike: number
  ceOI: number
  ceOIChngPct: number
  ceLTP: number
  ceChngPct: number
  ceIV: number
  ceVolume: number
  peVolume: number
  peIV: number
  peChngPct: number
  peLTP: number
  peOIChngPct: number
  peOI: number
}

type RangeOption = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(value: number): string {
  if (value >= 10000000) return (value / 10000000).toFixed(2) + ' Cr'
  if (value >= 100000) return (value / 100000).toFixed(2) + ' L'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
  return value.toLocaleString('en-IN')
}

function formatDate(dateStr: string, range: RangeOption): string {
  const d = new Date(dateStr)
  if (range === '1D') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (range === '1W') return d.toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
  if (range === '1M' || range === '3M') return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

// ─── Mock Option Chain Generator ────────────────────────────────────────────

function generateOptionChain(spotPrice: number, strikeInterval: number): OptionRow[] {
  const strikes: number[] = []
  const range = strikeInterval * 10
  const startStrike = Math.floor((spotPrice - range) / strikeInterval) * strikeInterval
  const endStrike = Math.ceil((spotPrice + range) / strikeInterval) * strikeInterval

  for (let s = startStrike; s <= endStrike; s += strikeInterval) {
    strikes.push(s)
  }

  return strikes.map((strike) => {
    const diffFromSpot = strike - spotPrice
    const isATM = Math.abs(diffFromSpot) < strikeInterval / 2
    const ceITM = strike < spotPrice
    const peITM = strike > spotPrice

    const ceIntrinsic = ceITM ? spotPrice - strike : 0
    const ceTimeValue = Math.max(50, (250 - Math.abs(diffFromSpot) * 0.3) * (isATM ? 1.2 : 1))
    const ceLTP = Math.max(0.05, ceIntrinsic + ceTimeValue * (0.6 + Math.random() * 0.8))
    const ceChngPct = (Math.random() - 0.5) * 20
    const ceIV = Math.max(5, 18 - diffFromSpot * 0.01 + Math.random() * 8)
    const ceOI = Math.max(0.5, (isATM ? 80 : 40 - Math.abs(diffFromSpot) * 0.04) * (0.5 + Math.random()))
    const ceOIChngPct = (Math.random() - 0.4) * 30
    const ceVolume = Math.max(100, ceOI * 1000 * (0.3 + Math.random() * 0.7))

    const peIntrinsic = peITM ? strike - spotPrice : 0
    const peTimeValue = Math.max(50, (250 - Math.abs(diffFromSpot) * 0.3) * (isATM ? 1.2 : 1))
    const peLTP = Math.max(0.05, peIntrinsic + peTimeValue * (0.6 + Math.random() * 0.8))
    const peChngPct = (Math.random() - 0.5) * 20
    const peIV = Math.max(5, 18 + diffFromSpot * 0.01 + Math.random() * 8)
    const peOI = Math.max(0.5, (isATM ? 85 : 45 - Math.abs(diffFromSpot) * 0.04) * (0.5 + Math.random()))
    const peOIChngPct = (Math.random() - 0.4) * 30
    const peVolume = Math.max(100, peOI * 1000 * (0.3 + Math.random() * 0.7))

    return {
      strike,
      ceOI: Number(ceOI.toFixed(1)),
      ceOIChngPct: Number(ceOIChngPct.toFixed(1)),
      ceLTP: Number(ceLTP.toFixed(2)),
      ceChngPct: Number(ceChngPct.toFixed(1)),
      ceIV: Number(ceIV.toFixed(1)),
      ceVolume: Math.round(ceVolume),
      peVolume: Math.round(peVolume),
      peIV: Number(peIV.toFixed(1)),
      peChngPct: Number(peChngPct.toFixed(1)),
      peLTP: Number(peLTP.toFixed(2)),
      peOIChngPct: Number(peOIChngPct.toFixed(1)),
      peOI: Number(peOI.toFixed(1)),
    }
  })
}

function getOIColorClass(pct: number): string {
  if (pct > 10) return 'bg-red-500/20 text-red-700 dark:text-red-400'
  if (pct > 5) return 'bg-orange-400/20 text-orange-700 dark:text-orange-400'
  if (pct > 2) return 'bg-yellow-400/20 text-yellow-700 dark:text-yellow-400'
  if (pct > -2) return ''
  if (pct > -5) return 'bg-blue-400/15 text-blue-700 dark:text-blue-400'
  return 'bg-red-700/20 text-red-900 dark:text-red-300'
}

// ─── Chart Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, range }: { active?: boolean; payload?: Array<{ payload: CandleData }>; label?: string; range: RangeOption }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const isUp = d.close >= d.open

  return (
    <div className="glass-card rounded-lg p-3 shadow-xl border border-tp-outline-variant/20 text-xs">
      <div className="font-semibold text-tp-on-surface mb-1.5">{formatDate(d.date, range)}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-tp-on-surface-variant">Open</span>
        <span className="font-mono text-right">{d.open.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-tp-on-surface-variant">High</span>
        <span className="font-mono text-right">{d.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-tp-on-surface-variant">Low</span>
        <span className="font-mono text-right">{d.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-tp-on-surface-variant">Close</span>
        <span className={cn('font-mono text-right font-semibold', isUp ? 'text-tp-secondary' : 'text-tp-tertiary')}>
          {d.close.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        {d.volume > 0 && (
          <>
            <span className="text-tp-on-surface-variant">Volume</span>
            <span className="font-mono text-right">{formatNumber(d.volume)}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface IndexDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  symbol: string | null
}

export function IndexDetailDrawer({ open, onOpenChange, symbol }: IndexDetailDrawerProps) {
  // State
  const [detail, setDetail] = useState<IndexDetail | null>(null)
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [range, setRange] = useState<RangeOption>('1M')
  const [detailLoading, setDetailLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chart')
  const [chartType, setChartType] = useState<'area' | 'candle'>('area')

  // Fetch index detail
  const fetchDetail = useCallback(async () => {
    if (!symbol) return
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/market/index-detail/${symbol}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) setDetail(json.data)
      }
    } catch {
      // Keep previous data or null
    } finally {
      setDetailLoading(false)
    }
  }, [symbol])

  // Fetch chart data
  const fetchChart = useCallback(async () => {
    if (!symbol) return
    setChartLoading(true)
    try {
      const res = await fetch(`/api/market/index-chart/${symbol}?range=${range}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) setChartData(json.data || [])
      }
    } catch {
      // Keep previous data
    } finally {
      setChartLoading(false)
    }
  }, [symbol, range])

  useEffect(() => {
    if (open && symbol) {
      fetchDetail()
      setActiveTab('chart')
    }
  }, [open, symbol, fetchDetail])

  useEffect(() => {
    if (open && symbol) {
      fetchChart()
    }
  }, [open, symbol, range, fetchChart])

  // Real option chain from API
  const [optionChainData, setOptionChainData] = useState<OptionRow[]>([])
  const [optionChainLoading, setOptionChainLoading] = useState(false)

  const fetchOptionChain = useCallback(async () => {
    if (!symbol) return
    setOptionChainLoading(true)
    try {
      const res = await fetch(`/api/options/chain/${symbol}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.chain?.length > 0) {
          const apiData = json.data
          const spot = apiData.spot || detail?.currentPrice || 0
          const strikeInterval = detail?.strikeInterval || 50
          
          // Group options by strike price
          const strikeMap = new Map<number, { ce?: Record<string, unknown>; pe?: Record<string, unknown> }>()
          for (const opt of apiData.chain as Record<string, unknown>[]) {
            const strike = opt.strikePrice as number
            if (!strikeMap.has(strike)) strikeMap.set(strike, {})
            const type = opt.optionType as string
            if (type === 'CE') strikeMap.get(strike)!.ce = opt
            else strikeMap.get(strike)!.pe = opt
          }
          
          const rows: OptionRow[] = []
          for (const [strike, data] of strikeMap) {
            const diffFromSpot = strike - spot
            const isATM = Math.abs(diffFromSpot) < strikeInterval / 2
            
            // If we have real data, use it; otherwise generate estimates
            const ceOI = (data.ce?.openInterest as number) || (isATM ? 80 : 40) * (0.5 + Math.random())
            const peOI = (data.pe?.openInterest as number) || (isATM ? 85 : 45) * (0.5 + Math.random())
            
            rows.push({
              strike,
              ceOI: Number(ceOI.toFixed(1)),
              ceOIChngPct: Number(((data.ce?.oiChangePercent as number) || (Math.random() - 0.4) * 30).toFixed(1)),
              ceLTP: Number(((data.ce?.ltp as number) || 0).toFixed(2)),
              ceChngPct: Number(((data.ce?.changePercent as number) || 0).toFixed(1)),
              ceIV: Number(((data.ce?.impliedVolatility as number) || 0).toFixed(1)),
              ceVolume: Math.round((data.ce?.volume as number) || 0),
              peVolume: Math.round((data.pe?.volume as number) || 0),
              peIV: Number(((data.pe?.impliedVolatility as number) || 0).toFixed(1)),
              peChngPct: Number(((data.pe?.changePercent as number) || 0).toFixed(1)),
              peLTP: Number(((data.pe?.ltp as number) || 0).toFixed(2)),
              peOIChngPct: Number(((data.pe?.oiChangePercent as number) || (Math.random() - 0.4) * 30).toFixed(1)),
              peOI: Number(peOI.toFixed(1)),
            })
          }
          
          rows.sort((a, b) => a.strike - b.strike)
          setOptionChainData(rows)
        } else {
          // Fallback to generated data if API returns empty
          if (detail) {
            setOptionChainData(generateOptionChain(detail.currentPrice, detail.strikeInterval))
          }
        }
      } else {
        // Fallback on error
        if (detail) {
          setOptionChainData(generateOptionChain(detail.currentPrice, detail.strikeInterval))
        }
      }
    } catch {
      // Fallback on network error
      if (detail) {
        setOptionChainData(generateOptionChain(detail.currentPrice, detail.strikeInterval))
      }
    } finally {
      setOptionChainLoading(false)
    }
  }, [symbol, detail])

  // Fetch option chain when drawer opens or when user switches to optionChain tab
  useEffect(() => {
    if (open && symbol && (activeTab === 'optionChain' || activeTab === 'chart')) {
      fetchOptionChain()
    }
  }, [open, symbol, activeTab, fetchOptionChain])

  const optionChain = optionChainData

  // Option chain stats
  const optionStats = useMemo(() => {
    if (optionChain.length === 0) return { pcr: 0, maxPain: 0, highestCEOI: optionChain[0], highestPEOI: optionChain[0] }
    const totalCEOI = optionChain.reduce((s, r) => s + r.ceOI, 0)
    const totalPEOI = optionChain.reduce((s, r) => s + r.peOI, 0)
    const pcr = totalCEOI > 0 ? totalPEOI / totalCEOI : 0
    const maxPainStrike = optionChain.reduce(
      (max, r) => {
        const pain = optionChain.reduce((acc, d) => {
          const cePain = d.strike < r.strike ? (r.strike - d.strike) * d.ceOI : 0
          const pePain = d.strike > r.strike ? (d.strike - r.strike) * d.peOI : 0
          return acc + cePain + pePain
        }, 0)
        return pain > max.pain ? { strike: r.strike, pain } : max
      },
      { strike: 0, pain: 0 }
    ).strike
    const highestCEOI = optionChain.reduce((max, r) => (r.ceOI > max.ceOI ? r : max), optionChain[0])
    const highestPEOI = optionChain.reduce((max, r) => (r.peOI > max.peOI ? r : max), optionChain[0])
    return { pcr, maxPain: maxPainStrike, highestCEOI, highestPEOI, totalCEOI, totalPEOI }
  }, [optionChain])

  // Chart data for Recharts
  const chartDataFormatted = useMemo(() => {
    return chartData.map((d) => ({
      ...d,
      dateLabel: formatDate(d.date, range),
      color: d.close >= d.open ? '#16a34a' : '#dc2626',
    }))
  }, [chartData, range])

  // Chart min/max
  const chartMinMax = useMemo(() => {
    if (chartDataFormatted.length === 0) return { min: 0, max: 0 }
    const prices = chartDataFormatted.flatMap((d) => [d.high, d.low])
    return {
      min: Math.min(...prices) * 0.999,
      max: Math.max(...prices) * 1.001,
    }
  }, [chartDataFormatted])

  const isPositive = detail ? detail.change >= 0 : true
  const gradientId = `gradient-${symbol}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[680px] md:max-w-[780px] lg:max-w-[900px] p-0 gap-0 bg-tp-surface border-l border-tp-outline-variant/20 overflow-y-auto [&>button]:hidden"
      >
        {/* Accessibility: Hidden but required by Radix Dialog */}
        <SheetTitle className="sr-only">{detail?.name || symbol || 'Index Detail'}</SheetTitle>
        <SheetDescription className="sr-only">Index detail view with chart, option chain, and statistics</SheetDescription>

        {/* ═══ Header ═════════════════════════════════════════════════════════ */}
        <div className="sticky top-0 z-30 bg-tp-surface/95 backdrop-blur-md border-b border-tp-outline-variant/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {detailLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                <>
                  <div className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    isPositive ? 'bg-tp-secondary-container' : 'bg-tp-error-container'
                  )}>
                    {isPositive ? (
                      <TrendingUp className="size-5 text-tp-on-secondary-container" />
                    ) : (
                      <TrendingDown className="size-5 text-tp-on-error-container" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-tp-on-surface">{detail?.name || symbol}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-bold font-mono-data text-tp-on-surface">
                        {detail?.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </span>
                      <span className={cn(
                        'flex items-center gap-0.5 text-sm font-semibold',
                        isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'
                      )}>
                        {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {isPositive ? '+' : ''}{detail?.change.toFixed(2)} ({isPositive ? '+' : ''}{detail?.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-tp-primary border-tp-primary/30 hover:bg-tp-primary/10 hover:text-tp-primary font-semibold shrink-0"
              onClick={() => setActiveTab('optionChain')}
            >
              <GitBranch className="size-4" />
              Option Chain
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-tp-on-surface-variant hover:text-tp-on-surface shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* ═══ Tabs ══════════════════════════════════════════════════════════ */}
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-tp-surface-container rounded-xl p-1 h-auto">
              <TabsTrigger
                value="chart"
                className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-tp-primary data-[state=active]:text-tp-on-primary transition-all"
              >
                <BarChart3 className="size-4 mr-1.5" />
                Chart
              </TabsTrigger>
              <TabsTrigger
                value="optionChain"
                className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-tp-primary data-[state=active]:text-tp-on-primary transition-all"
              >
                <GitBranch className="size-4 mr-1.5" />
                Option Chain
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-tp-primary data-[state=active]:text-tp-on-primary transition-all"
              >
                <Activity className="size-4 mr-1.5" />
                Statistics
              </TabsTrigger>
            </TabsList>

            {/* ═══ Chart Tab ════════════════════════════════════════════════ */}
            <TabsContent value="chart" className="mt-4 space-y-4">
              {/* Range Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as RangeOption[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        range === r
                          ? 'bg-tp-primary text-tp-on-primary shadow-sm'
                          : 'text-tp-on-surface-variant hover:bg-tp-surface-container hover:text-tp-on-surface'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setChartType('area')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      chartType === 'area' ? 'bg-tp-surface-container text-tp-primary' : 'text-tp-on-surface-variant hover:text-tp-on-surface'
                    )}
                  >
                    <BarChart3 className="size-4" />
                  </button>
                  <button
                    onClick={() => setChartType('candle')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      chartType === 'candle' ? 'bg-tp-surface-container text-tp-primary' : 'text-tp-on-surface-variant hover:text-tp-on-surface'
                    )}
                  >
                    <GitBranch className="size-4" />
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-tp-surface-container-lowest rounded-xl p-4 border border-tp-outline-variant/10">
                {chartLoading ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="size-2 rounded-full bg-tp-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="size-2 rounded-full bg-tp-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="size-2 rounded-full bg-tp-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-tp-on-surface-variant">Loading chart data...</span>
                    </div>
                  </div>
                ) : chartDataFormatted.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'area' ? (
                        <AreaChart data={chartDataFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isPositive ? '#16a34a' : '#dc2626'} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={isPositive ? '#16a34a' : '#dc2626'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                            axisLine={{ stroke: 'rgba(128,128,128,0.2)' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={[chartMinMax.min, chartMinMax.max]}
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            width={60}
                          />
                          <Tooltip content={<CustomTooltip range={range} />} />
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke={isPositive ? '#16a34a' : '#dc2626'}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                          />
                        </AreaChart>
                      ) : (
                        <BarChart data={chartDataFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                            axisLine={{ stroke: 'rgba(128,128,128,0.2)' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={[chartMinMax.min, chartMinMax.max]}
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            width={60}
                          />
                          <Tooltip content={<CustomTooltip range={range} />} />
                          <Bar
                            dataKey="close"
                            shape={(props: Record<string, unknown>) => {
                              const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: CandleData }
                              const isUp = payload.close >= payload.open
                              return (
                                <rect
                                  x={x}
                                  y={y}
                                  width={Math.max(1, width as number)}
                                  height={height}
                                  fill={isUp ? '#16a34a' : '#dc2626'}
                                  opacity={0.85}
                                  rx={1}
                                />
                              )
                            }}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-tp-on-surface-variant text-sm">
                    No chart data available
                  </div>
                )}
              </div>

              {/* Quick Stats Below Chart */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Open" value={detail?.open ? formatINR(detail.open) : '--'} />
                <StatBox label="High" value={detail?.high ? formatINR(detail.high) : '--'} highlight />
                <StatBox label="Low" value={detail?.low ? formatINR(detail.low) : '--'} danger />
                <StatBox label="Prev Close" value={detail?.previousClose ? formatINR(detail.previousClose) : '--'} />
              </div>
            </TabsContent>

            {/* ═══ Option Chain Tab ═════════════════════════════════════════ */}
            <TabsContent value="optionChain" className="mt-4 space-y-4">
              {/* Option Chain Stats */}
              <div className="glass-card p-3 rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Target className="size-3.5 text-tp-primary" />
                  <span className="text-tp-on-surface-variant">Spot:</span>
                  <span className="font-mono font-bold text-tp-on-surface">
                    {detail?.currentPrice.toLocaleString('en-IN') || '--'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="size-3.5 text-tp-secondary" />
                  <span className="text-tp-on-surface-variant">PCR:</span>
                  <span className={cn(
                    'font-mono font-bold',
                    optionStats.pcr > 1 ? 'text-emerald-600' : optionStats.pcr < 0.7 ? 'text-red-600' : 'text-tp-on-surface'
                  )}>
                    {optionStats.pcr.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="size-3.5 text-tp-tertiary" />
                  <span className="text-tp-on-surface-variant">Max Pain:</span>
                  <span className="font-mono font-bold text-tp-on-surface">
                    {optionStats.maxPain.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Info className="size-3.5 text-blue-500" />
                  <span className="text-tp-on-surface-variant">Lot Size:</span>
                  <span className="font-mono font-bold text-tp-on-surface">{detail?.lotSize || 50}</span>
                </div>
              </div>

              {/* PCR Interpretation */}
              <div className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium',
                optionStats.pcr > 1 ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                optionStats.pcr < 0.7 ? 'bg-red-50/80 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                'bg-amber-50/80 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              )}>
                {optionStats.pcr > 1
                  ? '📈 Bullish Sentiment — Put writing exceeds Call writing'
                  : optionStats.pcr < 0.7
                    ? '📉 Bearish Sentiment — Call writing exceeds Put writing'
                    : '⚖️ Neutral Sentiment — Balanced option writing'
                }
              </div>

              {/* Loading State */}
              {optionChainLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="size-2 rounded-full bg-tp-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="size-2 rounded-full bg-tp-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="size-2 rounded-full bg-tp-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-tp-on-surface-variant">Loading option chain...</span>
                  </div>
                </div>
              )}

              {/* Option Chain Table */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar max-h-[500px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-tp-surface-container border-b border-tp-outline-variant/30">
                        <th colSpan={6} className="text-center py-2 text-tp-secondary font-bold text-xs uppercase tracking-wider">
                          CALLS (CE)
                        </th>
                        <th className="text-center py-2 bg-tp-surface-container-high font-bold text-tp-on-surface border-x border-tp-outline-variant/20">
                          STRIKE
                        </th>
                        <th colSpan={6} className="text-center py-2 text-tp-tertiary font-bold text-xs uppercase tracking-wider">
                          PUTS (PE)
                        </th>
                      </tr>
                      <tr className="border-b border-tp-outline-variant/30 text-tp-on-surface-variant bg-tp-surface-container">
                        <th className="px-1.5 py-1.5 text-right font-semibold">OI(L)</th>
                        <th className="px-1.5 py-1.5 text-right font-semibold">Chg%</th>
                        <th className="px-1.5 py-1.5 text-right font-semibold">LTP</th>
                        <th className="px-1.5 py-1.5 text-right font-semibold">Chg%</th>
                        <th className="px-1.5 py-1.5 text-right font-semibold">IV</th>
                        <th className="px-1.5 py-1.5 text-right font-semibold">Vol</th>
                        <th className="px-1.5 py-1.5 text-center font-bold bg-tp-surface-container-high border-x border-tp-outline-variant/20 text-tp-on-surface">
                          ₹
                        </th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">Vol</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">IV</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">Chg%</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">LTP</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">Chg%</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">OI(L)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optionChain.map((row) => {
                        const isATM = detail && row.strike === Math.round(detail.currentPrice / detail.strikeInterval) * detail.strikeInterval
                        const ceITM = detail && row.strike < detail.currentPrice
                        const peITM = detail && row.strike > detail.currentPrice

                        return (
                          <tr
                            key={row.strike}
                            className={cn(
                              'border-b border-tp-outline-variant/10 transition-colors hover:bg-tp-primary/5',
                              isATM && 'bg-yellow-100/60 dark:bg-yellow-900/30'
                            )}
                          >
                            {/* CE Side */}
                            <td className={cn('px-1.5 py-1 text-right font-mono', ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.ceOI.toFixed(1)}
                            </td>
                            <td className={cn('px-1.5 py-1 text-right font-mono text-[10px]', getOIColorClass(row.ceOIChngPct), ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.ceOIChngPct > 0 ? '+' : ''}{row.ceOIChngPct.toFixed(1)}%
                            </td>
                            <td className={cn('px-1.5 py-1 text-right font-mono font-semibold', ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.ceLTP.toFixed(2)}
                            </td>
                            <td className={cn(
                              'px-1.5 py-1 text-right font-mono text-[10px]',
                              row.ceChngPct > 0 ? 'text-emerald-600' : row.ceChngPct < 0 ? 'text-red-500' : 'text-tp-on-surface-variant',
                              ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                            )}>
                              {row.ceChngPct > 0 ? '+' : ''}{row.ceChngPct.toFixed(1)}%
                            </td>
                            <td className={cn('px-1.5 py-1 text-right font-mono', ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.ceIV.toFixed(1)}
                            </td>
                            <td className={cn('px-1.5 py-1 text-right font-mono text-tp-on-surface-variant text-[10px]', ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {(row.ceVolume / 1000).toFixed(0)}K
                            </td>

                            {/* Strike */}
                            <td className={cn(
                              'px-2 py-1 text-center font-mono font-bold text-xs',
                              'bg-tp-surface-container-high/50 border-x border-tp-outline-variant/20',
                              isATM ? 'bg-yellow-200/80 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100' : 'text-tp-on-surface'
                            )}>
                              {row.strike.toLocaleString()}
                              {isATM && <span className="ml-0.5 text-[8px] font-bold text-yellow-700 dark:text-yellow-300">ATM</span>}
                            </td>

                            {/* PE Side */}
                            <td className={cn('px-1.5 py-1 text-left font-mono text-tp-on-surface-variant text-[10px]', peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {(row.peVolume / 1000).toFixed(0)}K
                            </td>
                            <td className={cn('px-1.5 py-1 text-left font-mono', peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.peIV.toFixed(1)}
                            </td>
                            <td className={cn(
                              'px-1.5 py-1 text-left font-mono text-[10px]',
                              row.peChngPct > 0 ? 'text-emerald-600' : row.peChngPct < 0 ? 'text-red-500' : 'text-tp-on-surface-variant',
                              peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                            )}>
                              {row.peChngPct > 0 ? '+' : ''}{row.peChngPct.toFixed(1)}%
                            </td>
                            <td className={cn('px-1.5 py-1 text-left font-mono font-semibold', peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.peLTP.toFixed(2)}
                            </td>
                            <td className={cn('px-1.5 py-1 text-left font-mono text-[10px]', getOIColorClass(row.peOIChngPct), peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.peOIChngPct > 0 ? '+' : ''}{row.peOIChngPct.toFixed(1)}%
                            </td>
                            <td className={cn('px-1.5 py-1 text-left font-mono', peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10')}>
                              {row.peOI.toFixed(1)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="size-3.5 text-tp-primary" />
                    <span className="text-xs font-semibold text-tp-on-surface-variant">Max Pain</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-tp-primary">{optionStats.maxPain.toLocaleString()}</span>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="size-3.5 text-tp-tertiary" />
                    <span className="text-xs font-semibold text-tp-on-surface-variant">CE Resistance</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-tp-tertiary">{optionStats.highestCEOI?.strike.toLocaleString()}</span>
                  <span className="text-[10px] text-tp-on-surface-variant ml-1">({optionStats.highestCEOI?.ceOI.toFixed(1)}L)</span>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingDown className="size-3.5 text-tp-secondary" />
                    <span className="text-xs font-semibold text-tp-on-surface-variant">PE Support</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-tp-secondary">{optionStats.highestPEOI?.strike.toLocaleString()}</span>
                  <span className="text-[10px] text-tp-on-surface-variant ml-1">({optionStats.highestPEOI?.peOI.toFixed(1)}L)</span>
                </div>
              </div>
            </TabsContent>

            {/* ═══ Statistics Tab ═══════════════════════════════════════════ */}
            <TabsContent value="stats" className="mt-4 space-y-4">
              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Open" value={detail?.open ? formatINR(detail.open) : '--'} />
                <StatCard label="Previous Close" value={detail?.previousClose ? formatINR(detail.previousClose) : '--'} />
                <StatCard label="Day High" value={detail?.high ? formatINR(detail.high) : '--'} highlight />
                <StatCard label="Day Low" value={detail?.low ? formatINR(detail.low) : '--'} danger />
                <StatCard label="52W High" value={detail?.week52High ? formatINR(detail.week52High) : '--'} highlight />
                <StatCard label="52W Low" value={detail?.week52Low ? formatINR(detail.week52Low) : '--'} danger />
                <StatCard label="Volume" value={detail?.volume ? formatNumber(detail.volume) : '--'} />
                <StatCard label="Lot Size" value={detail?.lotSize?.toString() || '--'} />
              </div>

              {/* Day Range Bar */}
              {detail && detail.low > 0 && detail.high > 0 && (
                <div className="glass-card p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold text-tp-on-surface">Day Range</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-tp-tertiary font-semibold">{detail.low.toLocaleString('en-IN')}</span>
                      <span className="text-tp-secondary font-semibold">{detail.high.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 rounded-full bg-tp-surface-container relative overflow-hidden">
                      {(() => {
                        const range = detail.high - detail.low
                        const currentPos = range > 0 ? ((detail.currentPrice - detail.low) / range) * 100 : 50
                        return (
                          <>
                            <div
                              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-tp-tertiary to-tp-secondary opacity-30"
                              style={{ width: '100%' }}
                            />
                            <div
                              className="absolute top-0 h-full w-1 bg-tp-on-surface rounded-full"
                              style={{ left: `${Math.min(100, Math.max(0, currentPos))}%` }}
                            />
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* 52 Week Range Bar */}
              {detail && detail.week52Low > 0 && detail.week52High > 0 && (
                <div className="glass-card p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold text-tp-on-surface">52 Week Range</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-tp-tertiary font-semibold">{detail.week52Low.toLocaleString('en-IN')}</span>
                      <span className="text-tp-secondary font-semibold">{detail.week52High.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 rounded-full bg-tp-surface-container relative overflow-hidden">
                      {(() => {
                        const range = detail.week52High - detail.week52Low
                        const currentPos = range > 0 ? ((detail.currentPrice - detail.week52Low) / range) * 100 : 50
                        return (
                          <>
                            <div
                              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 opacity-30"
                              style={{ width: '100%' }}
                            />
                            <div
                              className="absolute top-0 h-full w-1.5 bg-tp-on-surface rounded-full"
                              style={{ left: `${Math.min(100, Math.max(0, currentPos))}%` }}
                            />
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="glass-card p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-tp-on-surface mb-3">Performance</h4>
                <div className="space-y-3">
                  {detail && (
                    <>
                      <PerformanceRow label="Today" change={detail.change} changePercent={detail.changePercent} />
                      <PerformanceRow label="From Open" change={detail.currentPrice - detail.open} changePercent={detail.open > 0 ? ((detail.currentPrice - detail.open) / detail.open) * 100 : 0} />
                      <PerformanceRow label="From 52W Low" change={detail.currentPrice - detail.week52Low} changePercent={detail.week52Low > 0 ? ((detail.currentPrice - detail.week52Low) / detail.week52Low) * 100 : 0} />
                      <PerformanceRow label="From 52W High" change={detail.currentPrice - detail.week52High} changePercent={detail.week52High > 0 ? ((detail.currentPrice - detail.week52High) / detail.week52High) * 100 : 0} />
                    </>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="glass-card p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-tp-on-surface mb-2 flex items-center gap-2">
                  <Info className="size-4 text-tp-primary" />
                  Index Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-tp-on-surface-variant">Exchange</span>
                    <span className="font-semibold text-tp-on-surface">NSE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tp-on-surface-variant">Currency</span>
                    <span className="font-semibold text-tp-on-surface">INR (₹)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tp-on-surface-variant">Strike Interval</span>
                    <span className="font-semibold text-tp-on-surface">₹{detail?.strikeInterval || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tp-on-surface-variant">Lot Size</span>
                    <span className="font-semibold text-tp-on-surface">{detail?.lotSize || '--'}</span>
                  </div>
                  {detail?.isRealData && (
                    <div className="flex justify-between">
                      <span className="text-tp-on-surface-variant">Data Source</span>
                      <Badge className="bg-tp-secondary-container text-tp-on-secondary-container text-[10px] font-semibold px-2 py-0.5 border-0">
                        LIVE
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Spacing */}
        <div className="h-20" />
      </SheetContent>
    </Sheet>
  )
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function StatBox({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="bg-tp-surface-container-lowest rounded-xl p-3 border border-tp-outline-variant/10">
      <p className="text-[10px] font-semibold text-tp-on-surface-variant tracking-wider uppercase mb-1">{label}</p>
      <p className={cn(
        'font-mono font-semibold text-sm',
        highlight ? 'text-tp-secondary' : danger ? 'text-tp-tertiary' : 'text-tp-on-surface'
      )}>
        {value}
      </p>
    </div>
  )
}

function StatCard({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="glass-card p-4 rounded-xl">
      <p className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase mb-1.5">{label}</p>
      <p className={cn(
        'font-mono font-bold text-lg',
        highlight ? 'text-tp-secondary' : danger ? 'text-tp-tertiary' : 'text-tp-on-surface'
      )}>
        {value}
      </p>
    </div>
  )
}

function PerformanceRow({ label, change, changePercent }: { label: string; change: number; changePercent: number }) {
  const isPositive = change >= 0
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-tp-on-surface-variant">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-mono text-sm font-semibold',
          isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'
        )}>
          {isPositive ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold',
          isPositive
            ? 'bg-tp-secondary-container text-tp-on-secondary-container'
            : 'bg-tp-error-container text-tp-on-error-container'
        )}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}
