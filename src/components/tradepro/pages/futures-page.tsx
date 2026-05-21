'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CandlestickChart,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  X,
  BarChart3,
  Wallet,
  Info,
  Loader2,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '@/lib/auth-store'
import { useTradeSuccess } from '@/components/tradepro/trade-success-popup'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────
type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX' | 'MIDCPNIFTY'
type OrderType = 'MARKET' | 'LIMIT' | 'SL'
type Direction = 'BUY' | 'SELL'

interface FuturesContract {
  id: string
  name: string
  expiry: string
  ltp: number
  change: number
  changePct: number
  oi: number
  volume: number
  lotSize: number
  underlying: string
  expiryDate: string
  marginPercent: number
}

interface PositionData {
  id: string
  symbol: string
  segment: string
  tradeDirection: string
  quantity: number
  entryPrice: number
  currentPrice: number
  totalInvested: number
  currentValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  lots: number
  lotSize: number
  marginUsed: number
  isOpen: boolean
  expiryDate?: string | null
}

interface PortfolioData {
  virtualBalance: number
  marginUsed: number
  availableMargin: number
}

// ─── Helper ──────────────────────────────────────────────────────────
function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function generatePriceData(spotPrice: number) {
  const data = []
  let price = spotPrice - 200 + Math.random() * 50
  for (let i = 0; i < 60; i++) {
    price = price + (Math.random() - 0.48) * 30
    const time = new Date()
    time.setMinutes(time.getMinutes() - (60 - i))
    data.push({
      time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      price: Number(price.toFixed(2)),
    })
  }
  return data
}

const INSTRUMENT_CONFIG: Record<Instrument, { lotSize: number }> = {
  NIFTY: { lotSize: 50 },
  BANKNIFTY: { lotSize: 25 },
  FINNIFTY: { lotSize: 25 },
  SENSEX: { lotSize: 15 },
  MIDCPNIFTY: { lotSize: 75 },
}

// ─── Main Component ──────────────────────────────────────────────────
export function FuturesPage() {
  const { token } = useAuthStore()
  const { showTradeSuccess } = useTradeSuccess()

  const [instrument, setInstrument] = useState<Instrument>('NIFTY')
  const [contractIdx, setContractIdx] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [direction, setDirection] = useState<Direction>('BUY')
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [lots, setLots] = useState(1)
  const [price, setPrice] = useState('')

  // Real data states
  const [contracts, setContracts] = useState<FuturesContract[]>([])
  const [positions, setPositions] = useState<PositionData[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [contractsLoading, setContractsLoading] = useState(true)
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [squaringOff, setSquaringOff] = useState<string | null>(null)

  const config = INSTRUMENT_CONFIG[instrument]
  const selectedContract = contracts[contractIdx] || null

  // ─── Fetch Futures Contracts ──────────────────────────────────
  const fetchContracts = useCallback(async () => {
    setContractsLoading(true)
    try {
      const res = await fetch(`/api/futures/${instrument}`)
      if (res.ok) {
        const json = await res.json()
        const futures = (json.data || []).map((f: Record<string, unknown>) => ({
          id: f.id as string,
          name: `${f.underlying} ${new Date(f.expiryDate as string).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
          expiry: new Date(f.expiryDate as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          ltp: (f.ltp as number) || 0,
          change: (f.change as number) || 0,
          changePct: (f.changePercent as number) || 0,
          oi: Number(((f.openInterest as number) || 0).toFixed(1)),
          volume: (f.volume as number) || 0,
          lotSize: (f.lotSize as number) || config.lotSize,
          underlying: (f.underlying as string) || instrument,
          expiryDate: f.expiryDate as string,
          marginPercent: (f.marginPercent as number) || 12,
        }))
        setContracts(futures)
        if (futures.length > 0 && contractIdx >= futures.length) {
          setContractIdx(0)
        }
      } else {
        setContracts([])
      }
    } catch {
      setContracts([])
    } finally {
      setContractsLoading(false)
    }
  }, [instrument, config.lotSize, contractIdx])

  // ─── Fetch Positions ──────────────────────────────────────────
  const fetchPositions = useCallback(async () => {
    if (!token) { setPositionsLoading(false); return }
    setPositionsLoading(true)
    try {
      const res = await fetch('/api/trade/positions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        const futuresPositions = (json.data || []).filter(
          (p: PositionData) => p.segment === 'FUTURES' && p.isOpen
        )
        setPositions(futuresPositions)
      } else {
        setPositions([])
      }
    } catch {
      setPositions([])
    } finally {
      setPositionsLoading(false)
    }
  }, [token])

  // ─── Fetch Portfolio ──────────────────────────────────────────
  const fetchPortfolio = useCallback(async () => {
    if (!token) { setPortfolioLoading(false); return }
    setPortfolioLoading(true)
    try {
      const res = await fetch('/api/trade/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPortfolio(json.data)
      } else {
        setPortfolio(null)
      }
    } catch {
      setPortfolio(null)
    } finally {
      setPortfolioLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  useEffect(() => {
    fetchPositions()
    fetchPortfolio()
  }, [fetchPositions, fetchPortfolio])

  const priceData = useMemo(() => {
    if (selectedContract) {
      return generatePriceData(selectedContract.ltp)
    }
    return []
  }, [selectedContract])

  const availableMargin = portfolio?.availableMargin ?? portfolio?.virtualBalance ?? 100000
  const totalPnl = positions.reduce((s, p) => s + (p.unrealizedPnl || 0), 0)

  const lotSize = selectedContract?.lotSize || config.lotSize
  const totalQty = lots * lotSize
  const marginPercent = selectedContract?.marginPercent || 12
  const marginRequired = selectedContract
    ? Math.round(selectedContract.ltp * totalQty * marginPercent / 100 * 100) / 100
    : 0

  const instruments: Instrument[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY']
  const monthLabels = ['Current Month', 'Next Month', 'Far Month']

  // ─── Place Futures Order ──────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!token || !selectedContract) return
    setPlacingOrder(true)
    try {
      const res = await fetch('/api/trade/place', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: instrument,
          direction,
          orderType,
          segment: 'FUTURES',
          productType: 'CARRY_FORWARD',
          quantity: totalQty,
          lots,
          price: orderType === 'MARKET' ? undefined : Number(price),
          expiryDate: selectedContract.expiryDate,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        showTradeSuccess({
          symbol: instrument,
          type: direction,
          qty: totalQty,
          price: selectedContract?.ltp || 0,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
          orderId: data.order?.id?.slice(-8).toUpperCase() || 'N/A',
          segment: 'FUTURES',
          totalValue: data.order?.totalValue,
          brokerage: data.order?.brokerage,
        })
        await Promise.all([fetchPositions(), fetchPortfolio()])
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  // ─── Square Off Position ──────────────────────────────────────
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
        toast.success(`Squared off ${symbol} futures position`)
        await Promise.all([fetchPositions(), fetchPortfolio()])
      } else {
        toast.error(data.error || 'Failed to square off')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSquaringOff(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
          <CandlestickChart className="size-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Futures Trading</h1>
          <p className="text-xs text-gray-400">Trade index & stock futures with real positions</p>
        </div>
      </div>

      {/* ── Instrument Selector ───────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {instruments.map((inst) => (
            <button
              key={inst}
              onClick={() => { setInstrument(inst); setContractIdx(0) }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
                instrument === inst
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-[#1f2937] text-gray-400 hover:bg-amber-500/10 hover:text-amber-500'
              )}
            >
              {inst}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-[#1f2937] text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-all"
            >
              <Search className="size-3.5" />
              Stocks
              <ChevronDown className="size-3" />
            </button>
            {searchOpen && (
              <div className="absolute top-full mt-2 right-0 z-50 w-72 bg-[#111827] border border-[#1f2937] rounded-xl shadow-xl p-3">
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                  autoFocus
                />
                <div className="text-xs text-gray-400 p-2">
                  Stock futures coming soon...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contract Selector Tabs ─────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
        {contractsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-amber-500" />
            <span className="ml-2 text-sm text-gray-400">Loading contracts...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No futures contracts found for {instrument}. Please seed the database.
          </div>
        ) : (
          <Tabs value={String(contractIdx)} onValueChange={(v) => setContractIdx(Number(v))}>
            <TabsList className="grid w-full grid-cols-3 mb-3">
              {monthLabels.map((label, idx) => (
                <TabsTrigger key={idx} value={String(idx)} className="text-xs md:text-sm" disabled={idx >= contracts.length}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {contracts.map((contract, idx) => (
              <TabsContent key={idx} value={String(idx)}>
                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                  <div>
                    <div className="text-xs text-gray-400">Contract</div>
                    <div className="font-bold text-white text-sm">{contract.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">LTP</div>
                    <div className="font-mono font-bold text-white">₹{contract.ltp.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Change</div>
                    <div className={cn(
                      'font-mono font-semibold text-sm',
                      contract.changePct > 0 ? 'text-emerald-500' : contract.changePct < 0 ? 'text-red-500' : 'text-gray-400'
                    )}>
                      {contract.changePct > 0 ? '+' : ''}{contract.changePct.toFixed(2)}%
                      <span className="ml-1 text-xs">({contract.change > 0 ? '+' : ''}{contract.change.toFixed(2)})</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">OI</div>
                    <div className="font-mono text-sm text-white">{contract.oi}L</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Volume</div>
                    <div className="font-mono text-sm text-white">{(contract.volume / 1000).toFixed(1)}K</div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* ── Main Trading Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Chart + Stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* Price Chart */}
          <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-500" />
                {selectedContract?.name || instrument} — Price Movement
              </h3>
              <Badge variant="outline" className="text-xs font-mono border-[#1f2937] text-gray-400">
                Live
              </Badge>
            </div>
            <div className="h-[300px] md:h-[350px]">
              {priceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <defs>
                      <linearGradient id="futuresGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.5} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      interval={9}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `₹${(v / 1000).toFixed(1)}K`}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #1f2937',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f9fafb',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#futuresGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Select a contract to view chart
                </div>
              )}
            </div>
          </div>

          {/* Key Stats */}
          {selectedContract && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">LTP</div>
                <div className="font-mono font-bold text-white text-lg">₹{selectedContract.ltp.toLocaleString()}</div>
              </div>
              <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Change</div>
                <div className={cn(
                  'font-mono font-bold text-lg',
                  selectedContract.changePct > 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {selectedContract.changePct > 0 ? '+' : ''}{selectedContract.changePct.toFixed(2)}%
                </div>
              </div>
              <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Open Interest</div>
                <div className="font-mono font-bold text-white text-lg">{selectedContract.oi}L</div>
              </div>
              <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Volume</div>
                <div className="font-mono font-bold text-white text-lg">{(selectedContract.volume / 1000).toFixed(1)}K</div>
              </div>
              <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Lot Size</div>
                <div className="font-mono font-bold text-white text-lg">{selectedContract.lotSize}</div>
              </div>
              <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Margin %</div>
                <div className="font-mono font-bold text-white text-lg">{selectedContract.marginPercent}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Panel */}
        <div className="lg:col-span-2">
          <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl space-y-4 sticky top-20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="size-4 text-amber-500" />
              Place Order
            </h3>

            {!selectedContract ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No contract available for trading
              </div>
            ) : (
              <>
                {/* BUY / SELL Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDirection('BUY')}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                      direction === 'BUY'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    )}
                  >
                    <ArrowUpRight className="size-4 inline mr-1" />
                    BUY
                  </button>
                  <button
                    onClick={() => setDirection('SELL')}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                      direction === 'SELL'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    )}
                  >
                    <ArrowDownRight className="size-4 inline mr-1" />
                    SELL
                  </button>
                </div>

                {/* Order Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Order Type
                  </label>
                  <div className="flex gap-2">
                    {(['MARKET', 'LIMIT', 'SL'] as OrderType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
                          orderType === type
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-[#1f2937] text-gray-400 hover:bg-amber-500/5'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lots Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Lots
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-10 shrink-0 border-[#1f2937]"
                      onClick={() => setLots(Math.max(1, lots - 1))}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      type="number"
                      value={lots}
                      onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center font-mono text-lg font-bold h-10 bg-[#0a0e17] border-[#1f2937]"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-10 shrink-0 border-[#1f2937]"
                      onClick={() => setLots(lots + 1)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Price Input (for Limit/SL) */}
                {(orderType === 'LIMIT' || orderType === 'SL') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Price (₹)
                    </label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={selectedContract.ltp.toFixed(2)}
                      className="font-mono h-10 bg-[#0a0e17] border-[#1f2937]"
                    />
                  </div>
                )}

                {/* Calculated Fields */}
                <div className="bg-[#0a0e17] border border-[#1f2937] p-3 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lot Size</span>
                    <span className="font-mono font-medium text-white">{lotSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Qty</span>
                    <span className="font-mono font-medium text-white">{totalQty}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#1f2937] pt-2">
                    <span className="text-gray-400 font-semibold">Margin Required</span>
                    <span className="font-mono font-bold text-amber-500 text-base">₹{Number(marginRequired).toLocaleString()}</span>
                  </div>
                </div>

                {/* Available Margin */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1f2937]/50">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-amber-500" />
                    <span className="text-xs font-medium text-gray-400">Available Margin</span>
                  </div>
                  <span className={cn(
                    'font-mono font-bold text-sm',
                    availableMargin >= marginRequired ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    ₹{availableMargin.toLocaleString()}
                  </span>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className={cn(
                    'w-full py-3 font-bold text-base transition-all duration-200',
                    direction === 'BUY'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  )}
                >
                  {placingOrder ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" />Placing Order...</>
                  ) : direction === 'BUY' ? (
                    <><ArrowUpRight className="size-4 mr-2" />Place BUY Order</>
                  ) : (
                    <><ArrowDownRight className="size-4 mr-2" />Place SELL Order</>
                  )}
                </Button>

                <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                  <Info className="size-3" />
                  Paper trading — No real money involved
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Open Futures Positions ─────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CandlestickChart className="size-4 text-amber-500" />
            Open Futures Positions
          </h3>
          {positions.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Net P&L:</span>
              <span className={cn(
                'font-mono font-bold',
                totalPnl > 0 ? 'text-emerald-500' : totalPnl < 0 ? 'text-red-500' : 'text-gray-400'
              )}>
                {totalPnl > 0 ? '+' : ''}₹{totalPnl.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {positionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-amber-500" />
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-[#1f2937] flex items-center justify-center mb-3">
              <Briefcase className="size-6 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium text-sm">No open futures positions</p>
            <p className="text-gray-600 text-xs mt-1">
              Place a futures order above to see your positions here
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937] text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-left">Direction</th>
                    <th className="px-3 py-2 text-right">Lots</th>
                    <th className="px-3 py-2 text-right">Entry Price</th>
                    <th className="px-3 py-2 text-right">LTP</th>
                    <th className="px-3 py-2 text-right">P&L</th>
                    <th className="px-3 py-2 text-right">Margin</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => {
                    const isPositive = pos.unrealizedPnl >= 0
                    return (
                      <tr key={pos.id} className="border-b border-[#1f2937] hover:bg-amber-500/5 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-white">
                          {pos.symbol}
                          <span className="text-xs text-gray-400 ml-1">FUT</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge className={cn(
                            'text-xs font-bold',
                            pos.tradeDirection === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          )}>
                            {pos.tradeDirection === 'BUY' ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                            {pos.tradeDirection}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-white">{pos.lots || Math.round(pos.quantity / (pos.lotSize || 50))}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-white">₹{pos.entryPrice.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-white">₹{pos.currentPrice.toLocaleString()}</td>
                        <td className={cn(
                          'px-3 py-2.5 text-right font-mono font-bold',
                          isPositive ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          {isPositive ? '+' : ''}₹{pos.unrealizedPnl.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-400">
                          ₹{(pos.marginUsed || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                            disabled={squaringOff === pos.id}
                            onClick={() => handleSquareOff(pos.id, pos.symbol)}
                          >
                            {squaringOff === pos.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <><X className="size-3 mr-1" />Square Off</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {positions.map((pos) => {
                const isPositive = pos.unrealizedPnl >= 0
                return (
                  <div key={pos.id} className="p-3 rounded-xl border border-[#1f2937] bg-[#0a0e17] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{pos.symbol} FUT</span>
                        <Badge className={cn(
                          'text-[10px] font-bold',
                          pos.tradeDirection === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        )}>
                          {pos.tradeDirection}
                        </Badge>
                      </div>
                      <span className={cn(
                        'font-mono font-bold',
                        isPositive ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {isPositive ? '+' : ''}₹{pos.unrealizedPnl.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{pos.lots || Math.round(pos.quantity / (pos.lotSize || 50))} lot(s)</span>
                      <span>₹{pos.entryPrice.toLocaleString()} → ₹{pos.currentPrice.toLocaleString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-7 text-red-500 border-red-500/20 hover:bg-red-500/10"
                      disabled={squaringOff === pos.id}
                      onClick={() => handleSquareOff(pos.id, pos.symbol)}
                    >
                      {squaringOff === pos.id ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <X className="size-3 mr-1" />
                      )}
                      Square Off
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
