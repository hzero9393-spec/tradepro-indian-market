'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Briefcase,
  Award,
  Crosshair,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────

interface TradeData {
  id: string
  userId: string
  segment: string
  productType: string
  tradeDirection: string
  symbol: string
  optionType?: string | null
  strikePrice?: number | null
  expiryDate?: string | null
  quantity: number
  fillPrice: number
  totalValue: number
  brokerage: number
  pnl: number | null
  pnlPercent: number | null
  executedAt: string
  squaredOffAt?: string | null
  createdAt: string
}

interface PortfolioData {
  virtualBalance: number
  marginUsed: number
  availableMargin: number
  totalInvested: number
  totalCurrentValue: number
  totalUnrealizedPnl: number
  totalRealizedPnl: number
  totalPortfolioValue: number
  totalPnl: number
  totalReturn: number
  totalTrades: number
  initialCapital: number
  openPositionsCount: number
  segments: {
    equity: { count: number; invested: number; currentValue: number; unrealizedPnl: number }
    futures: { count: number; invested: number; currentValue: number; unrealizedPnl: number; marginUsed: number }
    options: { count: number; invested: number; currentValue: number; unrealizedPnl: number; marginUsed: number }
  }
}

interface PositionData {
  id: string
  segment: string
  symbol: string
  tradeDirection: string
  unrealizedPnl: number
  totalInvested: number
  isOpen: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

// ─── Custom Tooltip ──────────────────────────────────────────────

function CustomAreaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  return (
    <div className="rounded-lg border border-[#1f2937]/60 bg-[#111827] px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="font-mono-data text-lg font-semibold text-white">
        {value !== undefined ? (value >= 0 ? '+' : '-') + formatINR(Math.abs(value)) : '—'}
      </p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────

export function ReportsPage() {
  const { token } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [trades, setTrades] = useState<TradeData[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(true)

  // ─── Fetch All Data ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [tradesRes, portfolioRes, positionsRes] = await Promise.all([
        fetch('/api/trade/trades?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/trade/portfolio', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/trade/positions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (tradesRes.ok) {
        const json = await tradesRes.json()
        setTrades(json.data || [])
      }
      if (portfolioRes.ok) {
        const json = await portfolioRes.json()
        setPortfolio(json.data)
      }
      if (positionsRes.ok) {
        const json = await positionsRes.json()
        setPositions(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Computed Metrics ─────────────────────────────────────

  const closedTrades = useMemo(() =>
    trades.filter(t => t.pnl !== null && t.pnl !== undefined),
    [trades]
  )

  const totalPnl = useMemo(() =>
    closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    [closedTrades]
  )

  const winningTrades = useMemo(() =>
    closedTrades.filter(t => (t.pnl || 0) > 0),
    [closedTrades]
  )

  const losingTrades = useMemo(() =>
    closedTrades.filter(t => (t.pnl || 0) < 0),
    [closedTrades]
  )

  const winRate = useMemo(() => {
    if (closedTrades.length === 0) return 0
    return Math.round((winningTrades.length / closedTrades.length) * 10000) / 100
  }, [closedTrades, winningTrades])

  const avgPnlPerTrade = useMemo(() => {
    if (closedTrades.length === 0) return 0
    return Math.round((totalPnl / closedTrades.length) * 100) / 100
  }, [closedTrades, totalPnl])

  // ─── P&L Over Time Chart Data ─────────────────────────────
  const pnlChartData = useMemo(() => {
    if (closedTrades.length === 0) return []

    const sorted = [...closedTrades].sort(
      (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
    )

    let cumulative = 0
    return sorted.map((trade) => {
      cumulative += trade.pnl || 0
      const date = new Date(trade.executedAt)
      const label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      return {
        date: label,
        pnl: Math.round(cumulative * 100) / 100,
        tradePnl: Math.round((trade.pnl || 0) * 100) / 100,
        symbol: trade.symbol,
      }
    })
  }, [closedTrades])

  // ─── Win/Loss Distribution ────────────────────────────────
  const winLossData = useMemo(() => {
    if (closedTrades.length === 0) return []
    return [
      { name: 'Winning', value: winningTrades.length, color: '#10b981' },
      { name: 'Losing', value: losingTrades.length, color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [closedTrades, winningTrades, losingTrades])

  const winLossTotal = winLossData.reduce((s, d) => s + d.value, 0)

  // ─── Segment-wise Breakdown ───────────────────────────────
  const segmentBreakdown = useMemo(() => {
    if (!portfolio) return []

    const segments = [
      {
        name: 'Equity',
        count: portfolio.segments.equity.count,
        invested: portfolio.segments.equity.invested,
        currentValue: portfolio.segments.equity.currentValue,
        unrealizedPnl: portfolio.segments.equity.unrealizedPnl,
        color: '#f59e0b',
      },
      {
        name: 'Futures',
        count: portfolio.segments.futures.count,
        invested: portfolio.segments.futures.invested,
        currentValue: portfolio.segments.futures.currentValue,
        unrealizedPnl: portfolio.segments.futures.unrealizedPnl,
        color: '#10b981',
      },
      {
        name: 'Options',
        count: portfolio.segments.options.count,
        invested: portfolio.segments.options.invested,
        currentValue: portfolio.segments.options.currentValue,
        unrealizedPnl: portfolio.segments.options.unrealizedPnl,
        color: '#ef4444',
      },
    ]

    return segments.filter(s => s.count > 0 || s.invested > 0)
  }, [portfolio])

  // ─── Key Metrics Stats Grid ───────────────────────────────
  const stats = [
    {
      label: 'Total P&L',
      value: totalPnl >= 0 ? `+${formatINR(Math.abs(totalPnl))}` : `-${formatINR(Math.abs(totalPnl))}`,
      icon: Landmark,
      positive: totalPnl >= 0,
      borderColor: totalPnl >= 0 ? 'border-l-emerald-500' : 'border-l-red-500',
      textColor: totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      positive: winRate >= 50,
      borderColor: winRate >= 50 ? 'border-l-emerald-500' : 'border-l-red-500',
      textColor: winRate >= 50 ? 'text-emerald-500' : 'text-red-500',
      bgColor: winRate >= 50 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Total Trades',
      value: String(trades.length),
      icon: Crosshair,
      positive: true,
      borderColor: 'border-l-amber-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Avg P&L / Trade',
      value: avgPnlPerTrade >= 0 ? `+${formatINR(Math.abs(avgPnlPerTrade))}` : `-${formatINR(Math.abs(avgPnlPerTrade))}`,
      icon: BarChart3,
      positive: avgPnlPerTrade >= 0,
      borderColor: avgPnlPerTrade >= 0 ? 'border-l-emerald-500' : 'border-l-red-500',
      textColor: avgPnlPerTrade >= 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: avgPnlPerTrade >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
  ]

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8 space-y-5">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-[#1f2937]" />
          <Skeleton className="h-4 w-72 bg-[#1f2937]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-[#1f2937]/60 bg-[#111827]">
              <CardContent className="p-4">
                <Skeleton className="h-3 w-20 mb-2 bg-[#1f2937]" />
                <Skeleton className="h-6 w-28 bg-[#1f2937]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl bg-[#1f2937]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Deep dive into your trading patterns, P&L trends, and segment performance.
        </p>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm border-l-4 ${stat.borderColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {stat.label}
                    </p>
                    <div className={`size-7 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`size-3.5 ${stat.textColor}`} />
                    </div>
                  </div>
                  <p className={`text-lg font-bold font-mono-data ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Empty State ─────────────────────────────────────────── */}
      {trades.length === 0 ? (
        <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-14 rounded-full bg-[#0d111c] flex items-center justify-center mb-4">
                <BarChart3 className="size-7 text-gray-400/40" />
              </div>
              <p className="text-gray-400 font-medium text-sm">No trades yet</p>
              <p className="text-gray-400/60 text-xs mt-1">
                Place your first trade to start tracking performance analytics
              </p>
              <Button
                size="sm"
                className="mt-4 gap-1.5 bg-amber-500 text-black font-semibold hover:bg-amber-400"
                onClick={() => setCurrentPage('trading')}
              >
                <TrendingUp className="size-3.5" />
                Start Trading
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── P&L Curve Chart ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      P&L Curve
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Running total of realized profit & loss from closed trades
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold border-0 ${
                      totalPnl >= 0
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {totalPnl >= 0 ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                    {totalPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pnlChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart
                      data={pnlChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="pnlGradientPositive"
                          x1="0" y1="0" x2="0" y2="1"
                        >
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient
                          id="pnlGradientNegative"
                          x1="0" y1="0" x2="0" y2="1"
                        >
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickFormatter={(v: number) =>
                          `₹${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                        }
                        width={60}
                      />
                      <RechartsTooltip
                        content={<CustomAreaTooltip />}
                        cursor={{
                          stroke: totalPnl >= 0 ? '#10b981' : '#ef4444',
                          strokeWidth: 1,
                          strokeDasharray: '4 4',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke={totalPnl >= 0 ? '#10b981' : '#ef4444'}
                        strokeWidth={2.5}
                        fill={totalPnl >= 0 ? 'url(#pnlGradientPositive)' : 'url(#pnlGradientNegative)'}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: totalPnl >= 0 ? '#10b981' : '#ef4444',
                          stroke: '#f9fafb',
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-gray-400">No closed trades to display</p>
                    <p className="text-xs text-gray-400/60 mt-1">
                      Close a position to see your P&L trend
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Win/Loss + Segment Analysis ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Win/Loss Ratio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-white">
                    Win/Loss Ratio
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Breakdown of profitable vs losing trades
                  </p>
                </CardHeader>
                <CardContent>
                  {winLossData.length > 0 && winLossTotal > 0 ? (
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                      {/* Donut Chart */}
                      <div className="relative h-44 w-44 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={winLossData}
                              cx="50%"
                              cy="50%"
                              innerRadius={52}
                              outerRadius={72}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                            >
                              {winLossData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) => `${value} trade${value !== 1 ? 's' : ''}`}
                              contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(31, 41, 55, 0.8)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#f9fafb',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                              }}
                              itemStyle={{ color: '#f9fafb' }}
                              labelStyle={{ color: '#9ca3af' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold leading-none text-white">
                            {winRate.toFixed(0)}%
                          </span>
                          <span className="text-[10px] uppercase text-gray-400">Win Rate</span>
                        </div>
                      </div>

                      {/* Legend + Details */}
                      <div className="flex w-full flex-col gap-4">
                        {winLossData.map((item) => {
                          const percent = ((item.value / winLossTotal) * 100).toFixed(1)
                          const isWin = item.name === 'Winning'
                          const pnlForGroup = isWin
                            ? winningTrades.reduce((s, t) => s + (t.pnl || 0), 0)
                            : losingTrades.reduce((s, t) => s + (t.pnl || 0), 0)
                          return (
                            <div key={item.name} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-xs font-semibold text-white">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-[#1f2937]/40 text-[10px] text-gray-400">
                                    {item.value} ({percent}%)
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Total P&L</span>
                                <span className={`font-mono-data text-sm font-semibold ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {pnlForGroup >= 0 ? '+' : '-'}{formatINR(Math.abs(pnlForGroup))}
                                </span>
                              </div>
                              {isWin && winningTrades.length > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Best Trade</span>
                                  <span className="font-mono-data text-sm font-semibold text-emerald-500">
                                    +{formatINR(Math.max(...winningTrades.map(t => t.pnl || 0)))}
                                  </span>
                                </div>
                              )}
                              {!isWin && losingTrades.length > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Worst Trade</span>
                                  <span className="font-mono-data text-sm font-semibold text-red-500">
                                    -{formatINR(Math.abs(Math.min(...losingTrades.map(t => t.pnl || 0))))}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-gray-400">No closed trades to analyze</p>
                      <p className="text-xs text-gray-400/60 mt-1">
                        Win/loss data appears after closing positions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Segment Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-white">
                    Segment Analysis
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Performance across Equity, Futures & Options
                  </p>
                </CardHeader>
                <CardContent>
                  {segmentBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {segmentBreakdown.map((segment) => {
                        const isProfit = segment.unrealizedPnl >= 0
                        const pnlPercent = segment.invested > 0
                          ? ((segment.unrealizedPnl / segment.invested) * 100).toFixed(2)
                          : '0.00'
                        return (
                          <div
                            key={segment.name}
                            className="rounded-xl border border-[#1f2937]/40 bg-[#0d111c]/50 p-4 hover:bg-[#0d111c]/80 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="size-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${segment.color}15` }}
                                >
                                  {segment.name === 'Equity' && <Briefcase className="size-4" style={{ color: segment.color }} />}
                                  {segment.name === 'Futures' && <TrendingUp className="size-4" style={{ color: segment.color }} />}
                                  {segment.name === 'Options' && <Award className="size-4" style={{ color: segment.color }} />}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-white">{segment.name}</span>
                                  <span className="ml-2 text-[10px] text-gray-400">
                                    {segment.count} position{segment.count !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold border-0 ${
                                  isProfit
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {isProfit ? '+' : ''}{pnlPercent}%
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Invested
                                </p>
                                <p className="font-mono-data text-sm font-semibold text-white mt-0.5">
                                  {formatINRWhole(segment.invested)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Current Value
                                </p>
                                <p className="font-mono-data text-sm font-semibold text-white mt-0.5">
                                  {formatINRWhole(segment.currentValue)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Unrealized P&L
                                </p>
                                <p className={`font-mono-data text-sm font-semibold mt-0.5 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {isProfit ? '+' : '-'}{formatINR(Math.abs(segment.unrealizedPnl))}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Segment totals */}
                      {portfolio && (
                        <div className="rounded-xl bg-[#0d111c]/50 p-3 border border-[#1f2937]/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Total Unrealized P&L</span>
                            <span className={`font-mono-data text-sm font-bold ${(portfolio.totalUnrealizedPnl) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {(portfolio.totalUnrealizedPnl) >= 0 ? '+' : '-'}{formatINR(Math.abs(portfolio.totalUnrealizedPnl))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-gray-400">No segment data yet</p>
                      <p className="text-xs text-gray-400/60 mt-1">
                        Open positions to see segment breakdown
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Trade Log Table ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      Trade Log
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                      All executed trades with P&L details
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-0 text-xs font-semibold">
                    {trades.length} Trade{trades.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-[#1f2937]/30">
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Symbol</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Side</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Segment</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Fill Price</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Total Value</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">P&L</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => {
                        const isBuy = trade.tradeDirection === 'BUY'
                        const hasPnl = trade.pnl !== null && trade.pnl !== undefined
                        const isPositive = hasPnl && trade.pnl! >= 0
                        return (
                          <TableRow
                            key={trade.id}
                            className="border-[#1f2937]/30 hover:bg-[#0d111c]/60 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-amber-500">{trade.symbol}</span>
                                {trade.segment === 'OPTIONS' && trade.strikePrice && (
                                  <span className="text-[10px] uppercase text-gray-400">
                                    {trade.strikePrice} {trade.optionType}
                                  </span>
                                )}
                                {trade.segment === 'FUTURES' && (
                                  <span className="text-[10px] text-gray-400">FUT</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] font-semibold border-0 gap-0.5 ${
                                  isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {isBuy ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                                {isBuy ? 'Buy' : 'Sell'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-400">{trade.segment}</TableCell>
                            <TableCell className="font-mono-data text-sm text-right text-white">{trade.quantity}</TableCell>
                            <TableCell className="font-mono-data text-sm text-right text-gray-400">
                              {formatINR(trade.fillPrice)}
                            </TableCell>
                            <TableCell className="font-mono-data text-sm text-right text-white">
                              {formatINRWhole(trade.totalValue)}
                            </TableCell>
                            <TableCell className={`font-mono-data text-sm font-semibold text-right ${
                              !hasPnl ? 'text-gray-400' : isPositive ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {!hasPnl ? '—' : `${isPositive ? '+' : '-'}${formatINR(Math.abs(trade.pnl!))}`}
                            </TableCell>
                            <TableCell className="text-xs text-gray-400 text-right">
                              {new Date(trade.executedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Performance Summary Footer ───────────────────────── */}
          {portfolio && closedTrades.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Gross Profit
                      </p>
                      <p className="font-mono-data text-sm font-bold text-emerald-500 mt-0.5">
                        +{formatINR(winningTrades.reduce((s, t) => s + (t.pnl || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Gross Loss
                      </p>
                      <p className="font-mono-data text-sm font-bold text-red-500 mt-0.5">
                        -{formatINR(Math.abs(losingTrades.reduce((s, t) => s + (t.pnl || 0), 0)))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Total Brokerage
                      </p>
                      <p className="font-mono-data text-sm font-bold text-white mt-0.5">
                        {formatINR(trades.reduce((s, t) => s + t.brokerage, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Net P&L
                      </p>
                      <p className={`font-mono-data text-sm font-bold mt-0.5 ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {totalPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
