'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Loader2,
  Briefcase,
  Calendar,
  Hash,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

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
  optionType?: string | null
  strikePrice?: number | null
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
  optionType?: string | null
  strikePrice?: number | null
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

function isIndexSymbol(symbol: string): boolean {
  return ['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'].includes(symbol.toUpperCase())
}

// ─── Order Detail Dialog ─────────────────────────────────────────

function OrderDetailDialog({
  open,
  onClose,
  order,
}: {
  open: boolean
  onClose: () => void
  order: OrderData | null
}) {
  if (!order) return null

  const isBuy = order.tradeDirection === 'BUY'
  const isPositive = (order.fillPrice ?? 0) >= order.price

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`text-lg ${isBuy ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
              {isBuy ? 'BUY' : 'SELL'}
            </span>
            <span className="font-bold text-tp-primary">{order.symbol}</span>
            <StatusBadge status={order.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Trade Summary */}
          <div className={`rounded-xl p-4 ${isBuy ? 'bg-tp-secondary/5 border border-tp-secondary/20' : 'bg-tp-tertiary/5 border border-tp-tertiary/20'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Symbol</p>
                <p className="font-bold text-tp-on-surface">{order.symbol}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Trade Type</p>
                <p className={`font-bold ${isBuy ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Entry Time</p>
                <p className="text-sm font-mono text-tp-on-s-surface">{formatDate(order.placedAt)} {formatTime(order.placedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Exit Time</p>
                <p className="text-sm font-mono text-tp-on-surface">
                  {order.filledAt ? `${formatDate(order.filledAt)} ${formatTime(order.filledAt)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Quantity</p>
                <p className="text-sm font-mono font-bold text-tp-on-surface">{order.quantity}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Entry Price</p>
                <p className="text-sm font-mono font-bold text-tp-on-surface">{formatINR(order.fillPrice ?? order.price)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Used Capital</p>
                <p className="text-sm font-mono font-bold text-tp-on-surface">{formatINR(order.totalValue)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant mb-1">Brokerage</p>
                <p className="text-sm font-mono text-tp-on-surface-variant">{formatINR(order.brokerage)}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="rounded-xl p-4 bg-tp-surface-container-low border border-tp-outline-variant/20 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="size-4 text-tp-primary" />
              <span className="text-sm font-bold text-tp-on-surface">Order Details</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Order ID</p>
                <p className="font-mono text-xs text-tp-on-surface-variant">#{order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Order Type</p>
                <p className="font-mono text-xs">{order.orderType}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Segment</p>
                <p className="text-xs">{order.segment}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Product</p>
                <p className="text-xs">{order.productType}</p>
              </div>
              {order.optionType && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Option Type</p>
                  <p className="text-xs font-bold">{order.optionType}</p>
                </div>
              )}
              {order.strikePrice && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Strike Price</p>
                  <p className="text-xs font-mono">{formatINR(order.strikePrice)}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Order Price</p>
                <p className="text-xs font-mono">{formatINR(order.price)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tp-on-surface-variant">Fill Price</p>
                <p className="text-xs font-mono">{order.fillPrice ? formatINR(order.fillPrice) : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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

  // Split orders by type
  const indexOrders = orders.filter(o => isIndexSymbol(o.symbol) || o.segment === 'FUTURES' || o.segment === 'OPTIONS')
  const stockOrders = orders.filter(o => !isIndexSymbol(o.symbol) && o.segment === 'EQUITY')

  const indexTrades = trades.filter(t => isIndexSymbol(t.symbol) || t.segment === 'FUTURES' || t.segment === 'OPTIONS')
  const stockTrades = trades.filter(t => !isIndexSymbol(t.symbol) && t.segment === 'EQUITY')

  // Stats
  const filledCount = orders.filter(o => o.status === 'FILLED').length
  const totalVolume = trades.reduce((s, t) => s + t.totalValue, 0)

  const handleOrderClick = (order: OrderData) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  // ─── Order Table Component ────────────────────────────────
  const OrderTable = ({ data, showAction = false }: { data: OrderData[]; showAction?: boolean }) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
            <FileText className="size-6 text-tp-on-surface-variant/40" />
          </div>
          <p className="text-tp-on-surface-variant font-medium text-sm">No orders found</p>
          <p className="text-tp-on-surface-variant/60 text-xs mt-1">Your orders will appear here</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Symbol</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Side</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Fill Price</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Value</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((order) => {
              const isBuy = order.tradeDirection === 'BUY'
              return (
                <TableRow
                  key={order.id}
                  className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50 cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell className="text-xs text-tp-on-surface-variant">
                    <div>{formatDate(order.placedAt)}</div>
                    <div className="font-mono-data text-[10px]">{formatTime(order.placedAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-tp-primary">{order.symbol}</span>
                      {order.optionType && order.strikePrice && (
                        <span className="text-[10px] text-tp-on-surface-variant">
                          {order.strikePrice} {order.optionType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] font-semibold border-0 gap-0.5 ${isBuy ? 'bg-tp-secondary/10 text-tp-secondary' : 'bg-tp-tertiary/10 text-tp-tertiary'}`}>
                      {isBuy ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                      {order.tradeDirection}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono-data text-sm text-right">{order.quantity}</TableCell>
                  <TableCell className="font-mono-data text-sm text-right">
                    {order.fillPrice ? formatINR(order.fillPrice) : '—'}
                  </TableCell>
                  <TableCell className="font-mono-data text-sm text-right text-tp-on-surface-variant">
                    {formatINR(order.totalValue)}
                  </TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // ─── Trade Table Component ────────────────────────────────
  const TradeTable = ({ data }: { data: TradeData[] }) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
            <Briefcase className="size-6 text-tp-on-surface-variant/40" />
          </div>
          <p className="text-tp-on-surface-variant font-medium text-sm">No trades yet</p>
          <p className="text-tp-on-surface-variant/60 text-xs mt-1">Your executed trades will appear here</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Time</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Symbol</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">Side</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Fill Price</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">Value</TableHead>
              <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((trade) => {
              const isPositive = (trade.pnl ?? 0) >= 0
              return (
                <TableRow key={trade.id} className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50">
                  <TableCell className="text-xs text-tp-on-surface-variant">
                    <div>{formatDate(trade.executedAt)}</div>
                    <div className="font-mono-data text-[10px]">{formatTime(trade.executedAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-tp-primary">{trade.symbol}</span>
                      {trade.optionType && trade.strikePrice && (
                        <span className="text-[10px] text-tp-on-surface-variant">
                          {trade.strikePrice} {trade.optionType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] font-semibold border-0 gap-0.5 ${trade.tradeDirection === 'BUY' ? 'bg-tp-secondary/10 text-tp-secondary' : 'bg-tp-tertiary/10 text-tp-tertiary'}`}>
                      {trade.tradeDirection === 'BUY' ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
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
    )
  }

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            Orders & Trades
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

      {/* ── Order Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: String(orders.length), icon: ClipboardList, color: 'tp-primary' },
          { label: 'Filled', value: String(filledCount), icon: CheckCircle2, color: 'tp-secondary' },
          { label: 'Cancelled', value: String(orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length), icon: XCircle, color: 'tp-tertiary' },
          { label: 'Total Volume', value: totalVolume >= 100000 ? `₹${(totalVolume / 100000).toFixed(1)}L` : `₹${totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: IndianRupee, color: 'tp-primary' },
        ].map((stat) => {
          const Icon = stat.icon
          const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
            'tp-primary': { bg: 'bg-tp-primary/10', text: 'text-tp-primary', border: 'border-l-tp-primary' },
            'tp-secondary': { bg: 'bg-tp-secondary/10', text: 'text-tp-secondary', border: 'border-l-tp-secondary' },
            'tp-tertiary': { bg: 'bg-tp-tertiary/10', text: 'text-tp-tertiary', border: 'border-l-tp-tertiary' },
          }
          const c = colorClasses[stat.color] || colorClasses['tp-primary']
          return (
            <Card key={stat.label} className={`glass-card rounded-xl shadow-sm border-l-4 ${c.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                    {stat.label}
                  </p>
                  <div className={`size-7 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <Icon className={`size-3.5 ${c.text}`} />
                  </div>
                </div>
                <p className="text-lg font-bold font-mono-data text-tp-on-surface">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Orders Table with Tabs ──────────────────────────────────── */}
      <Card className="glass-card rounded-xl shadow-sm">
        <Tabs defaultValue="index">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="index" className="text-xs font-semibold gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                    Index
                  </Badge>
                  Index ({indexOrders.length})
                </TabsTrigger>
                <TabsTrigger value="stock" className="text-xs font-semibold gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-secondary/30 text-secondary">
                    Stock
                  </Badge>
                  Stock ({stockOrders.length})
                </TabsTrigger>
                <TabsTrigger value="trades" className="text-xs font-semibold gap-1.5">
                  <IndianRupee className="size-3.5" />
                  Trade Log ({trades.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingOrders || loadingTrades ? (
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
            ) : (
              <>
                <TabsContent value="index">
                  <OrderTable data={indexOrders} />
                </TabsContent>
                <TabsContent value="stock">
                  <OrderTable data={stockOrders} />
                </TabsContent>
                <TabsContent value="trades">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        Index ({indexTrades.length})
                      </Badge>
                      <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                        Stock ({stockTrades.length})
                      </Badge>
                    </div>
                    <TradeTable data={trades} />
                  </div>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* ── Order Detail Dialog ─────────────────────────────────────── */}
      <OrderDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
      />
    </div>
  )
}
