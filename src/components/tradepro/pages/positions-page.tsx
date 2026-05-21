'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Crosshair,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Briefcase,
  TrendingUp,
  IndianRupee,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
  lots: number
  lotSize: number
  isOpen: boolean
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

// ─── Component ───────────────────────────────────────────────────

export function PositionsPage() {
  const { token } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(true)
  const [squaringOff, setSquaringOff] = useState<string | null>(null)

  // ─── Fetch Positions ──────────────────────────────────────
  const fetchPositions = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch('/api/trade/positions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPositions(json.data || [])
      } else {
        setPositions([])
      }
    } catch {
      setPositions([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchPositions()
    // Auto-refresh every 5 seconds for live P&L
    const interval = setInterval(fetchPositions, 5000)
    return () => clearInterval(interval)
  }, [fetchPositions])

  // ─── Square Off ───────────────────────────────────────────
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
        const pnlStr = data.closedPosition
          ? `P&L: ${data.closedPosition.realizedPnl >= 0 ? '+' : ''}₹${Math.abs(data.closedPosition.realizedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          : ''
        toast.success(`✅ ${symbol} squared off successfully!`, {
          description: pnlStr,
        })
        await fetchPositions()
      } else {
        toast.error(data.error || 'Failed to square off position')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSquaringOff(null)
    }
  }

  // ─── Split positions by type ──────────────────────────────
  const indexPositions = useMemo(() =>
    positions.filter(p =>
      p.segment === 'FUTURES' || p.segment === 'OPTIONS' ||
      ['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'].includes(p.symbol.toUpperCase())
    ),
    [positions]
  )

  const stockPositions = useMemo(() =>
    positions.filter(p =>
      p.segment === 'EQUITY' &&
      !['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'].includes(p.symbol.toUpperCase())
    ),
    [positions]
  )

  // ─── Stats ────────────────────────────────────────────────
  const totalPnl = positions.reduce((s, p) => s + (p.unrealizedPnl || 0), 0)
  const totalInvested = positions.reduce((s, p) => s + (p.totalInvested || 0), 0)
  const totalMargin = positions.reduce((s, p) => s + (p.marginUsed || 0), 0)
  const isProfit = totalPnl >= 0

  const stats = [
    { label: 'Open Positions', value: String(positions.length), icon: Crosshair, borderColor: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Total Invested', value: formatINRWhole(totalInvested), icon: IndianRupee, borderColor: 'border-l-gray-400', iconBg: 'bg-gray-500/10', iconColor: 'text-gray-400' },
    { label: 'Unrealized P&L', value: `${isProfit ? '+' : '-'}${formatINR(Math.abs(totalPnl))}`, icon: isProfit ? TrendingUp : AlertTriangle, borderColor: isProfit ? 'border-l-emerald-500' : 'border-l-red-500', iconBg: isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10', iconColor: isProfit ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Margin Used', value: formatINRWhole(totalMargin), icon: IndianRupee, borderColor: 'border-l-amber-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
  ]

  // ─── Position Table Component ─────────────────────────────
  const PositionTable = ({ data }: { data: PositionData[] }) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-[#111827] border border-[#1f2937] flex items-center justify-center mb-4">
            <Briefcase className="size-7 text-gray-500" />
          </div>
          <p className="text-white font-semibold text-sm">No open positions</p>
          <p className="text-gray-400 text-xs mt-1.5">
            Place a trade to see your positions here
          </p>
          <Button
            size="sm"
            className="mt-5 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            onClick={() => setCurrentPage('trading')}
          >
            <TrendingUp className="size-3.5" />
            Start Trading
          </Button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[#1f2937] bg-[#0a0e17]">
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Symbol</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Side</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Segment</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Entry</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">LTP</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">P&L</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-right">Chg %</TableHead>
              <TableHead className="text-gray-400 font-semibold text-xs uppercase tracking-wider text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {data.map((pos) => {
                const isLong = pos.tradeDirection === 'BUY'
                const isPositive = pos.unrealizedPnl >= 0

                return (
                  <motion.tr
                    key={pos.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="border-[#1f2937] hover:bg-[#1f2937]/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{pos.symbol}</span>
                        {pos.segment === 'OPTIONS' && pos.strikePrice && (
                          <span className="text-[10px] uppercase text-gray-400">
                            {pos.strikePrice} {pos.optionType}
                          </span>
                        )}
                        {pos.segment === 'FUTURES' && (
                          <span className="text-[10px] text-gray-400">FUT</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold border-0 gap-0.5 ${
                          isLong
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {isLong ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                        {isLong ? 'BUY' : 'SELL'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{pos.segment}</TableCell>
                    <TableCell className="font-mono-data text-sm text-right text-white">{pos.quantity}</TableCell>
                    <TableCell className="font-mono-data text-sm text-right text-gray-400">
                      {formatINR(pos.entryPrice)}
                    </TableCell>
                    <TableCell className="font-mono-data text-sm text-right text-white">
                      {formatINR(pos.currentPrice)}
                    </TableCell>
                    <TableCell className={`font-mono-data text-sm font-semibold text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : '-'}{formatINR(Math.abs(pos.unrealizedPnl))}
                    </TableCell>
                    <TableCell className={`font-mono-data text-sm font-medium text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded border border-orange-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange-500 bg-transparent transition-all hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95"
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
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Open Positions
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Track and close your active trades with real-time P&amp;L updates.
        </p>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`bg-[#111827] border border-[#1f2937] border-l-4 ${stat.borderColor} rounded-xl shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </p>
                  <div className={`size-7 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`size-3.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-lg font-bold font-mono-data text-white">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Positions Table with Tabs ───────────────────────────────── */}
      <Card className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-sm">
        <Tabs defaultValue="index">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <TabsList className="bg-[#0a0e17] border border-[#1f2937]">
                <TabsTrigger
                  value="index"
                  className="text-xs font-semibold gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-[#0a0e17] data-[state=active]:shadow-amber-500/20 data-[state=active]:shadow-sm text-gray-400"
                >
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-500">
                    Index
                  </Badge>
                  Index ({indexPositions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="stock"
                  className="text-xs font-semibold gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-[#0a0e17] data-[state=active]:shadow-amber-500/20 data-[state=active]:shadow-sm text-gray-400"
                >
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-500">
                    Stock
                  </Badge>
                  Stock ({stockPositions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-[#0a0e17] data-[state=active]:shadow-amber-500/20 data-[state=active]:shadow-sm text-gray-400"
                >
                  All ({positions.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <div className="p-6 pt-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20 bg-[#1f2937]" />
                    <Skeleton className="h-4 w-16 bg-[#1f2937]" />
                    <Skeleton className="h-4 w-16 bg-[#1f2937]" />
                    <Skeleton className="h-4 w-20 bg-[#1f2937]" />
                    <Skeleton className="h-4 w-20 bg-[#1f2937]" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="index">
                  <PositionTable data={indexPositions} />
                </TabsContent>
                <TabsContent value="stock">
                  <PositionTable data={stockPositions} />
                </TabsContent>
                <TabsContent value="all">
                  <PositionTable data={positions} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
