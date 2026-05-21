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
    { name: 'Equity', value: portfolio.totalCurrentValue, color: '#0058be' },
    { name: 'Cash', value: portfolio.virtualBalance, color: '#c2c6d6' },
  ].filter(d => d.value > 0) : []

  const allocationTotal = allocationData.reduce((s, d) => s + d.value, 0)

  // Summary cards data
  const totalValue = portfolio?.totalPortfolioValue ?? 0
  const investedAmount = portfolio?.totalInvested ?? 0
  const unrealizedPnl = portfolio?.totalUnrealizedPnl ?? 0
  const realizedPnl = portfolio?.totalRealizedPnl ?? 0
  const totalReturn = portfolio?.totalReturn ?? 0

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-tp-on-surface sm:text-3xl">
            Portfolio Overview
          </h1>
          <p className="mt-1 text-sm text-tp-on-surface-variant">
            Real-time performance tracking for your paper trading assets.
          </p>
        </div>
        <Button
          className="gap-1.5 rounded-lg bg-tp-primary text-tp-on-primary shadow-md hover:shadow-lg active:scale-[0.98]"
          onClick={() => setCurrentPage('trading')}
        >
          <TrendingUp className="size-4" />
          New Trade
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card rounded-xl shadow-sm border-l-4 border-l-tp-primary">
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
              <Card className="glass-card rounded-xl border-l-4 border-l-tp-primary shadow-md">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                      Total Value
                    </p>
                    <Landmark className="size-5 text-tp-primary" />
                  </div>
                  <h3 className="font-mono-data text-2xl font-bold text-tp-on-surface">
                    {formatINRWhole(totalValue)}
                    <span className="text-lg opacity-50">.{Math.abs(totalValue % 1).toFixed(2).substring(2)}</span>
                  </h3>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${totalReturn >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                    {totalReturn >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% from start
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Invested Amount */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-card rounded-xl border-l-4 border-l-tp-outline-variant shadow-md">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                      Invested Amount
                    </p>
                    <IndianRupee className="size-5 text-tp-outline" />
                  </div>
                  <h3 className="font-mono-data text-2xl font-bold text-tp-on-surface">
                    {formatINRWhole(investedAmount)}
                    {investedAmount % 1 > 0 && <span className="text-lg opacity-50">.{Math.abs(investedAmount % 1).toFixed(2).substring(2)}</span>}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-tp-on-surface-variant">
                    {positions.length} position{positions.length !== 1 ? 's' : ''} active
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Unrealized P&L */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card rounded-xl border-l-4 border-l-tp-secondary shadow-md">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                      Unrealized P&amp;L
                    </p>
                    {unrealizedPnl >= 0 ? <TrendingUp className="size-5 text-tp-secondary" /> : <TrendingDown className="size-5 text-tp-tertiary" />}
                  </div>
                  <h3 className={`font-mono-data text-2xl font-bold ${unrealizedPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                    {unrealizedPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(unrealizedPnl))}
                  </h3>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${unrealizedPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                    {unrealizedPnl >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {investedAmount > 0 ? ((unrealizedPnl / investedAmount) * 100).toFixed(2) : '0.00'}% ROI
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Realized P&L */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-card rounded-xl border-l-4 border-l-tp-tertiary shadow-md">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                      Realized P&amp;L
                    </p>
                    <Wallet className="size-5 text-tp-tertiary" />
                  </div>
                  <h3 className={`font-mono-data text-2xl font-bold ${realizedPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                    {realizedPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(realizedPnl))}
                  </h3>
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${realizedPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                    {realizedPnl >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    From closed positions
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Detailed Holdings Table ───────────────────────── */}
          <section className="glass-card mb-6 overflow-hidden rounded-xl border border-tp-outline-variant/30 shadow-md">
            <div className="flex items-center justify-between border-b border-tp-outline-variant/20 px-6 py-4">
              <h4 className="text-lg font-semibold text-tp-on-surface sm:text-xl">
                Open Positions
              </h4>
              <Badge variant="secondary" className="bg-tp-primary/10 text-tp-primary border-0 text-xs font-semibold">
                {positions.length} Active
              </Badge>
            </div>

            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-14 rounded-full bg-tp-surface-container flex items-center justify-center mb-4">
                  <Briefcase className="size-7 text-tp-on-surface-variant/40" />
                </div>
                <p className="text-tp-on-surface-variant font-medium text-sm">No open positions yet</p>
                <p className="text-tp-on-surface-variant/60 text-xs mt-1">
                  Start trading to see your positions here
                </p>
                <Button
                  size="sm"
                  className="mt-4 gap-1.5 bg-tp-primary hover:bg-tp-primary/90"
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
                    <TableRow className="bg-tp-surface-container-low/50 hover:bg-tp-surface-container-low/50">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        Symbol
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        Direction
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        Segment
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        Qty
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        Avg. Price
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        LTP
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        P&amp;L (%)
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                        P&amp;L (₹)
                      </TableHead>
                      <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
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
                          className="transition-colors hover:bg-tp-surface-container-low/50"
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-tp-primary">{pos.symbol}</span>
                              {pos.segment === 'OPTIONS' && pos.strikePrice && (
                                <span className="text-[10px] uppercase text-tp-on-surface-variant">
                                  {pos.strikePrice} {pos.optionType}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold border-0 gap-0.5 ${
                                isLong ? 'bg-tp-secondary/10 text-tp-secondary' : 'bg-tp-tertiary/10 text-tp-tertiary'
                              }`}
                            >
                              {isLong ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                              {isLong ? 'Long' : 'Short'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-tp-on-surface-variant">{pos.segment}</TableCell>
                          <TableCell className="text-right font-mono-data text-sm">{pos.quantity}</TableCell>
                          <TableCell className="text-right font-mono-data text-sm text-tp-on-surface-variant">
                            {formatINR(pos.entryPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono-data text-sm">
                            {formatINR(pos.currentPrice)}
                          </TableCell>
                          <TableCell className={`text-right font-mono-data text-sm font-semibold ${isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                            {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className={`text-right font-mono-data text-sm font-semibold ${isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                            {isPositive ? '+' : '-'}{formatINR(Math.abs(pnlValue))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded border border-tp-tertiary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-tp-tertiary transition-all hover:bg-tp-tertiary hover:text-tp-on-tertiary active:scale-95"
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
            {/* Portfolio Allocation */}
            <div className="glass-card rounded-xl p-6 shadow-md lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-tp-on-surface sm:text-xl">
                  Portfolio Allocation
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
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: '1px solid #c2c6d6',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold leading-none text-tp-on-surface">
                        {investedAmount > 0 && totalValue > 0 ? Math.round((investedAmount / totalValue) * 100) : 0}%
                      </span>
                      <span className="text-[10px] uppercase text-tp-on-surface-variant">Invested</span>
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
                            <span className="text-xs font-semibold text-tp-on-surface">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data text-sm text-tp-on-surface">
                              ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                            <Badge variant="outline" className="border-tp-outline-variant/30 text-[10px] text-tp-on-surface-variant">
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
                  <p className="text-sm text-tp-on-surface-variant">No allocation data yet</p>
                  <p className="text-xs text-tp-on-surface-variant/60 mt-1">Start trading to see your portfolio allocation</p>
                </div>
              )}
            </div>

            {/* Account Summary */}
            <div className="glass-card rounded-xl p-6 shadow-md">
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-tp-on-surface-variant">
                Account Summary
              </h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Available Balance</span>
                  <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                    {formatINR(portfolio?.virtualBalance ?? 100000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Margin Used</span>
                  <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                    {formatINR(portfolio?.marginUsed ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Available Margin</span>
                  <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                    {formatINR(portfolio?.availableMargin ?? 100000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Total Trades</span>
                  <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                    {portfolio?.totalTrades ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Open Positions</span>
                  <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                    {portfolio?.openPositionsCount ?? 0}
                  </span>
                </div>
                <div className="h-px bg-tp-outline-variant/20 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Initial Capital</span>
                  <span className="font-mono-data text-sm font-semibold text-tp-on-surface-variant">
                    ₹1,00,000
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-tp-on-surface-variant">Overall P&amp;L</span>
                  <span className={`font-mono-data text-sm font-bold ${(portfolio?.totalPnl ?? 0) >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
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
