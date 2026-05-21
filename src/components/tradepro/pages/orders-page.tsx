'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ClipboardList,
  X,
  Loader2,
  Briefcase,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────

interface OrderData {
  id: string
  symbol: string
  orderType: string
  tradeDirection: string
  segment: string
  productType: string
  quantity: number
  price: number
  fillPrice: number | null
  totalValue: number
  brokerage: number
  status: string
  rejectReason: string | null
  placedAt: string
  filledAt: string | null
  cancelledAt: string | null
  createdAt: string
}

interface TradeData {
  id: string
  symbol: string
  tradeDirection: string
  segment: string
  productType: string
  quantity: number
  fillPrice: number
  totalValue: number
  brokerage: number
  pnl: number | null
  pnlPercent: number | null
  executedAt: string
  order?: {
    status: string
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    PARTIALLY_FILLED: 'bg-blue-50 text-blue-700 border-blue-200',
    FILLED: 'bg-tp-secondary/10 text-tp-secondary border-tp-secondary/20',
    CANCELLED: 'bg-tp-tertiary/10 text-tp-tertiary border-tp-tertiary/20',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    EXPIRED: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${variants[status] || ''}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

// ─── Component ───────────────────────────────────────────────────

export function OrdersPage() {
  const { token } = useAuthStore()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<OrderData[]>([])
  const [trades, setTrades] = useState<TradeData[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingTrades, setLoadingTrades] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setLoadingOrders(true)
    try {
      const res = await fetch('/api/trade/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setOrders(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingOrders(false)
    }
  }, [token])

  const fetchTrades = useCallback(async () => {
    if (!token) return
    setLoadingTrades(true)
    try {
      const res = await fetch('/api/trade/trades?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrades(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingTrades(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrders()
    fetchTrades()
  }, [fetchOrders, fetchTrades])

  const handleCancelOrder = async (orderId: string) => {
    if (!token) return
    setCancelling(orderId)
    try {
      const res = await fetch('/api/trade/orders', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, action: 'cancel' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Order cancelled')
        await fetchOrders()
      } else {
        toast.error(data.error || 'Failed to cancel order')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setCancelling(null)
    }
  }

  // Split orders
  const openOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PARTIALLY_FILLED')
  const orderHistory = orders.filter(o => o.status !== 'PENDING' && o.status !== 'PARTIALLY_FILLED')

  // Filter order history
  const filteredHistory = orderHistory.filter((o) => {
    if (filter === 'all') return true
    if (filter === 'filled') return o.status === 'FILLED'
    if (filter === 'cancelled') return o.status === 'CANCELLED' || o.status === 'REJECTED'
    return true
  })

  const searchedHistory = filteredHistory.filter((o) =>
    o.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const pendingCount = openOrders.length
  const filledCount = orders.filter(o => o.status === 'FILLED').length
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length
  const totalVolume = trades.reduce((s, t) => s + t.totalValue, 0)

  const stats = [
    { label: 'Open Orders', value: String(pendingCount), icon: Clock, color: 'tp-primary' as const },
    { label: 'Filled', value: String(filledCount), icon: CheckCircle2, color: 'tp-secondary' as const },
    { label: 'Cancelled', value: String(cancelledCount), icon: XCircle, color: 'tp-tertiary' as const },
    { label: 'Total Volume', value: totalVolume >= 100000 ? `₹${(totalVolume / 100000).toFixed(1)}L` : `₹${totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: IndianRupee, color: 'tp-primary' as const },
  ]

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            Order Management
          </h1>
          <p className="text-tp-on-surface-variant mt-1 text-sm">
            Track and manage your trading orders and execution history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-tp-surface-container-lowest border-tp-outline-variant/40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-outline" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-48 sm:w-56 bg-tp-surface-container-lowest border-tp-outline-variant/40 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Order Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
            'tp-primary': { bg: 'bg-tp-primary/10', text: 'text-tp-primary', border: 'border-l-tp-primary' },
            'tp-secondary': { bg: 'bg-tp-secondary/10', text: 'text-tp-secondary', border: 'border-l-tp-secondary' },
            'tp-tertiary': { bg: 'bg-tp-tertiary/10', text: 'text-tp-tertiary', border: 'border-l-tp-tertiary' },
          }
          const c = colorClasses[stat.color] || colorClasses['tp-primary']
          return (
            <Card key={stat.label} className={`glass-card rounded-xl shadow-sm border-l-4 ${c.border}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                    {stat.label}
                  </p>
                  <div className={`size-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <Icon className={`size-4 ${c.text}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono-data text-tp-on-surface">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Orders Table ────────────────────────────────────────────────── */}
      <Card className="glass-card rounded-xl shadow-sm">
        <Tabs defaultValue="open">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="open" className="text-xs font-semibold gap-1.5">
                  <ClipboardList className="size-3.5" />
                  Open ({openOrders.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-semibold gap-1.5">
                  <FileText className="size-3.5" />
                  History ({orderHistory.length})
                </TabsTrigger>
                <TabsTrigger value="trades" className="text-xs font-semibold gap-1.5">
                  <IndianRupee className="size-3.5" />
                  Trade Log ({trades.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Open Orders Tab */}
            <TabsContent value="open">
              {loadingOrders ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : openOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
                    <ClipboardList className="size-6 text-tp-on-surface-variant/40" />
                  </div>
                  <p className="text-tp-on-surface-variant font-medium text-sm">No open orders</p>
                  <p className="text-tp-on-surface-variant/60 text-xs mt-1">Place a trade to see pending orders here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Time</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Instrument</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Side</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Price</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openOrders.map((order) => (
                        <TableRow key={order.id} className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50">
                          <TableCell className="font-mono-data text-xs text-tp-on-surface-variant">
                            {formatTime(order.placedAt)}
                          </TableCell>
                          <TableCell className="font-bold text-sm text-tp-primary">{order.symbol}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] font-semibold border-0 gap-0.5 ${order.tradeDirection === 'BUY' ? 'bg-tp-secondary/10 text-tp-secondary' : 'bg-tp-tertiary/10 text-tp-tertiary'}`}>
                              {order.tradeDirection === 'BUY' ? <ArrowDownRight className="size-2.5" /> : <ArrowUpRight className="size-2.5" />}
                              {order.tradeDirection}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono-data text-sm text-right">{order.quantity}</TableCell>
                          <TableCell className="font-mono-data text-sm text-right">{formatINR(order.price)}</TableCell>
                          <TableCell><StatusBadge status={order.status} /></TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs font-semibold text-tp-tertiary hover:bg-tp-tertiary/10 hover:text-tp-tertiary gap-1"
                              disabled={cancelling === order.id}
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              {cancelling === order.id ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Order History Tab */}
            <TabsContent value="history">
              {loadingOrders ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : searchedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
                    <FileText className="size-6 text-tp-on-surface-variant/40" />
                  </div>
                  <p className="text-tp-on-surface-variant font-medium text-sm">No order history</p>
                  <p className="text-tp-on-surface-variant/60 text-xs mt-1">Your completed orders will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Instrument</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Side</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Order Price</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Fill Price</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchedHistory.map((order) => (
                        <TableRow key={order.id} className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50">
                          <TableCell className="text-xs text-tp-on-surface-variant">
                            <div>{formatDate(order.placedAt)}</div>
                            <div className="font-mono-data text-[10px]">{formatTime(order.placedAt)}</div>
                          </TableCell>
                          <TableCell className="font-bold text-sm text-tp-primary">{order.symbol}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] font-semibold border-0 gap-0.5 ${order.tradeDirection === 'BUY' ? 'bg-tp-secondary/10 text-tp-secondary' : 'bg-tp-tertiary/10 text-tp-tertiary'}`}>
                              {order.tradeDirection === 'BUY' ? <ArrowDownRight className="size-2.5" /> : <ArrowUpRight className="size-2.5" />}
                              {order.tradeDirection}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono-data text-sm text-right">{order.quantity}</TableCell>
                          <TableCell className="font-mono-data text-sm text-right text-tp-on-surface-variant">{formatINR(order.price)}</TableCell>
                          <TableCell className="font-mono-data text-sm text-right">
                            {order.fillPrice ? formatINR(order.fillPrice) : '—'}
                          </TableCell>
                          <TableCell><StatusBadge status={order.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Trade Log Tab */}
            <TabsContent value="trades">
              {loadingTrades ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : trades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
                    <Briefcase className="size-6 text-tp-on-surface-variant/40" />
                  </div>
                  <p className="text-tp-on-surface-variant font-medium text-sm">No trades yet</p>
                  <p className="text-tp-on-surface-variant/60 text-xs mt-1">Your executed trades will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Time</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Instrument</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Side</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Fill Price</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Value</TableHead>
                        <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">P&amp;L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => {
                        const isPositive = (trade.pnl ?? 0) >= 0
                        return (
                          <TableRow key={trade.id} className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50">
                            <TableCell className="text-xs text-tp-on-surface-variant">
                              <div>{formatDate(trade.executedAt)}</div>
                              <div className="font-mono-data text-[10px]">{formatTime(trade.executedAt)}</div>
                            </TableCell>
                            <TableCell className="font-bold text-sm text-tp-primary">{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] font-semibold border-0 gap-0.5 ${trade.tradeDirection === 'BUY' ? 'bg-tp-secondary/10 text-tp-secondary' : 'bg-tp-tertiary/10 text-tp-tertiary'}`}>
                                {trade.tradeDirection === 'BUY' ? <ArrowDownRight className="size-2.5" /> : <ArrowUpRight className="size-2.5" />}
                                {trade.tradeDirection}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono-data text-sm text-right">{trade.quantity}</TableCell>
                            <TableCell className="font-mono-data text-sm text-right">{formatINR(trade.fillPrice)}</TableCell>
                            <TableCell className="font-mono-data text-sm text-right text-tp-on-surface-variant">{formatINR(trade.totalValue)}</TableCell>
                            <TableCell className={`font-mono-data text-sm font-semibold text-right ${trade.pnl !== null ? (isPositive ? 'text-tp-secondary' : 'text-tp-tertiary') : 'text-tp-on-surface-variant'}`}>
                              {trade.pnl !== null
                                ? `${isPositive ? '+' : '-'}${formatINR(Math.abs(trade.pnl))}`
                                : '—'
                              }
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
