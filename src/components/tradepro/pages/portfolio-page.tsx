'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Landmark,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Loader2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────

interface PositionData {
  id: string
  segment: string
  productType: string
  tradeDirection: string
  symbol: string
  optionType?: string | null
  strikePrice?: number | null
  expiryDate?: string | null
  quantity: number
  entryPrice: number
  currentPrice: number
  totalInvested: number
  currentValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  marginUsed: number
  isOpen: boolean
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
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

// ─── Component ───────────────────────────────────────────────────

export default function PortfolioPage() {
  const { token, user } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(true)
  const [squaringOff, setSquaringOff] = useState<string | null>(null)

  const fetchPortfolio = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/trade/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPortfolio(json.data)
      }
    } catch {
      // silent
    }
  }, [token])

  const fetchPositions = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/trade/positions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPositions(json.data || [])
      }
    } catch {
      // silent
    }
  }, [token])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchPortfolio(), fetchPositions()])
    setLoading(false)
  }, [fetchPortfolio, fetchPositions])

  useEffect(() => {
    loadData()
    // Auto-refresh every 10 seconds for live P&L
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleSquareOff = async (positionId: string, symbol: string) => {
    if (!token) return
    setSquaringOff(positionId)
    try {
      const res = await fetch('/api/trade/square-off', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positionId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Squared off ${symbol}`)
        await loadData()
      } else {
        toast.error(data.error || 'Failed to square off')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSquaringOff(null)
    }
  }

  // Allocation data from real positions
  const allocationData = portfolio ? [
    { name: 'Equity', value: portfolio.totalCurrentValue, color: '#f59e0b' },
    { name: 'Cash', value: portfolio.virtualBalance, color: '#374151' },
  ].filter(d => d.value > 0) : []

  const allocationTotal = allocationData.reduce((s, d) => s + d.value, 0)

  // Summary cards data
  const totalValue = portfolio?.totalPortfolioValue ?? 0
  const investedAmount = portfolio?.totalInvested ?? 0
  const unrealizedPnl = portfolio?.totalUnrealizedPnl ?? 0
  const realizedPnl = portfolio?.totalRealizedPnl ?? 0
  const totalReturn = portfolio?.totalReturn ?? 0

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Portfolio Tracker
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Monitor your holdings, allocation, and returns in real-time.
          </p>
        </div>
        <Button
          className="gap-1.5 rounded-lg bg-amber-500 text-black font-semibold shadow-md hover:bg-amber-400 active:scale-[0.98]"
          onClick={() => setCurrentPage('trading')}
        >
          <TrendingUp className="size-4" />
          New Trade
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-36 mb-2" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* ── Summary Cards ─────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Value */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-md border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Total Value
                    </p>
                    <Landmark className="size-5 text-amber-500" />
                  </div>
                  <h3 className="font-mono-data text-2xl font-bold text-white">
                    {formatINRWhole(totalValue)}
                    <span className="text-lg opacity-50">.{Math.abs(totalValue % 1).toFixed(2).substring(2)}</span>
                  </h3>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {totalReturn >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% from start
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Invested Amount */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-md border-l-4 border-l-gray-500">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Invested Amount
                    </p>
                    <IndianRupee className="size-5 text-gray-400" />
                  </div>
                  <h3 className="font-mono-data text-2xl font-bold text-white">
                    {formatINRWhole(investedAmount)}
                    {investedAmount % 1 > 0 && <span className="text-lg opacity-50">.{Math.abs(investedAmount % 1).toFixed(2).substring(2)}</span>}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-gray-400">
                    {positions.length} position{positions.length !== 1 ? 's' : ''} active
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Unrealized P&L */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-md border-l-4 border-l-emerald-500">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Unrealized P&amp;L
                    </p>
                    {unrealizedPnl >= 0 ? <TrendingUp className="size-5 text-emerald-500" /> : <TrendingDown className="size-5 text-red-500" />}
                  </div>
                  <h3 className={`font-mono-data text-2xl font-bold ${unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {unrealizedPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(unrealizedPnl))}
                  </h3>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {unrealizedPnl >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {investedAmount > 0 ? ((unrealizedPnl / investedAmount) * 100).toFixed(2) : '0.00'}% ROI
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Realized P&L */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-md border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Realized P&amp;L
                    </p>
                    <Wallet className="size-5 text-red-500" />
                  </div>
                  <h3 className={`font-mono-data text-2xl font-bold ${realizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {realizedPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(realizedPnl))}
                  </h3>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${realizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {realizedPnl >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    From closed positions
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Detailed Holdings Table ───────────────────────── */}
          <section className="mb-6 overflow-hidden rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-md">
            <div className="flex items-center justify-between border-b border-[#1f2937]/40 px-6 py-4">
              <h4 className="text-lg font-semibold text-white sm:text-xl">
                Active Holdings
              </h4>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-0 text-xs font-semibold">
                {positions.length} Active
              </Badge>
            </div>

            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-14 rounded-full bg-[#0d111c] flex items-center justify-center mb-4">
                  <Briefcase className="size-7 text-gray-400/40" />
                </div>
                <p className="text-gray-400 font-medium text-sm">No open positions yet</p>
                <p className="text-gray-400/60 text-xs mt-1">
                  Start trading to see your positions here
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
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0d111c]/60 hover:bg-[#0d111c]/60">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Symbol
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Direction
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Segment
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Qty
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Avg. Price
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        LTP
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        P&amp;L (%)
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        P&amp;L (₹)
                      </TableHead>
                      <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((pos) => {
                      const isLong = pos.tradeDirection === 'BUY'
                      const pnlValue = pos.unrealizedPnl
                      const pnlPercent = pos.unrealizedPnlPercent
                      const isPositive = pnlValue >= 0

                      return (
                        <TableRow
                          key={pos.id}
                          className="transition-colors hover:bg-[#0d111c]/60 border-[#1f2937]/30"
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-amber-500">{pos.symbol}</span>
                              {pos.segment === 'OPTIONS' && pos.strikePrice && (
                                <span className="text-[10px] uppercase text-gray-400">
                                  {pos.strikePrice} {pos.optionType}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold border-0 gap-0.5 ${
                                isLong ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {isLong ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                              {isLong ? 'Long' : 'Short'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">{pos.segment}</TableCell>
                          <TableCell className="text-right font-mono-data text-sm text-white">{pos.quantity}</TableCell>
                          <TableCell className="text-right font-mono-data text-sm text-gray-400">
                            {formatINR(pos.entryPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono-data text-sm text-white">
                            {formatINR(pos.currentPrice)}
                          </TableCell>
                          <TableCell className={`text-right font-mono-data text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className={`text-right font-mono-data text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : '-'}{formatINR(Math.abs(pnlValue))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded border border-orange-500/50 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange-500 transition-all hover:bg-orange-500 hover:text-white active:scale-95"
                              disabled={squaringOff === pos.id}
                              onClick={() => handleSquareOff(pos.id, pos.symbol)}
                            >
                              {squaringOff === pos.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                'Square Off'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* ── Bottom Section: Allocation + Balance ──── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Asset Allocation */}
            <div className="rounded-xl border border-[#1f2937]/60 bg-[#111827] p-6 shadow-md lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white sm:text-xl">
                  Asset Allocation
                </h4>
              </div>
              {allocationData.length > 0 && allocationTotal > 0 ? (
                <div className="flex flex-col items-center gap-8 sm:flex-row">
                  {/* Donut Chart */}
                  <div className="relative h-48 w-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
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
                        {investedAmount > 0 && totalValue > 0 ? Math.round((investedAmount / totalValue) * 100) : 0}%
                      </span>
                      <span className="text-[10px] uppercase text-gray-400">Invested</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex w-full flex-col gap-4">
                    {allocationData.map((item) => {
                      const percent = ((item.value / allocationTotal) * 100).toFixed(1)
                      return (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-semibold text-white">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data text-sm text-white">
                              ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                            <Badge variant="outline" className="border-[#1f2937]/40 text-[10px] text-gray-400">
                              {percent}%
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-gray-400">No allocation data yet</p>
                  <p className="text-xs text-gray-400/60 mt-1">Start trading to see your portfolio allocation</p>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="rounded-xl border border-[#1f2937]/60 bg-[#111827] p-6 shadow-md">
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Account Details
              </h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Available Balance</span>
                  <span className="font-mono-data text-sm font-semibold text-white">
                    {formatINR(portfolio?.virtualBalance ?? 100000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Margin Used</span>
                  <span className="font-mono-data text-sm font-semibold text-white">
                    {formatINR(portfolio?.marginUsed ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Available Margin</span>
                  <span className="font-mono-data text-sm font-semibold text-white">
                    {formatINR(portfolio?.availableMargin ?? 100000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Total Trades</span>
                  <span className="font-mono-data text-sm font-semibold text-white">
                    {portfolio?.totalTrades ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Open Positions</span>
                  <span className="font-mono-data text-sm font-semibold text-white">
                    {portfolio?.openPositionsCount ?? 0}
                  </span>
                </div>
                <div className="h-px bg-[#1f2937]/30 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Initial Capital</span>
                  <span className="font-mono-data text-sm font-semibold text-gray-400">
                    ₹1,00,000
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Overall P&amp;L</span>
                  <span className={`font-mono-data text-sm font-bold ${(portfolio?.totalPnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {(portfolio?.totalPnl ?? 0) >= 0 ? '+' : '-'}{formatINR(Math.abs(portfolio?.totalPnl ?? 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
