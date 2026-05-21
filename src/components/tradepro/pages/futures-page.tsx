'use client'

import { useState, useMemo } from 'react'
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

// ─── Types ───────────────────────────────────────────────────────────
type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX' | 'MIDCPNIFTY'
type OrderType = 'MARKET' | 'LIMIT' | 'SL'
type Direction = 'BUY' | 'SELL'

interface FuturesContract {
  name: string
  expiry: string
  ltp: number
  change: number
  changePct: number
  oi: number
  volume: number
  lotSize: number
}

interface Position {
  id: string
  symbol: string
  contract: string
  direction: Direction
  lots: number
  entryPrice: number
  ltp: number
  pnl: number
}

// ─── Mock Data ───────────────────────────────────────────────────────
const INSTRUMENT_CONFIG: Record<Instrument, { spot: number; lotSize: number }> = {
  NIFTY: { spot: 19500.25, lotSize: 50 },
  BANKNIFTY: { spot: 42500.5, lotSize: 25 },
  FINNIFTY: { spot: 20850.75, lotSize: 25 },
  SENSEX: { spot: 64800.0, lotSize: 15 },
  MIDCPNIFTY: { spot: 12250.0, lotSize: 75 },
}

function generateFuturesContracts(instrument: Instrument): FuturesContract[] {
  const config = INSTRUMENT_CONFIG[instrument]
  const months = ['Mar 2025', 'Apr 2025', 'May 2025']
  const premiums = [45.5, 125.75, 210.0]

  return months.map((month, idx) => ({
    name: `${instrument} ${month}`,
    expiry: `27 ${month.split(' ')[0]} 2025`,
    ltp: Number((config.spot + premiums[idx]).toFixed(2)),
    change: Number(((Math.random() - 0.4) * 100).toFixed(2)),
    changePct: Number(((Math.random() - 0.4) * 2).toFixed(2)),
    oi: Number((Math.random() * 50 + 20).toFixed(1)),
    volume: Math.round(Math.random() * 50000 + 10000),
    lotSize: config.lotSize,
  }))
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

const MOCK_POSITIONS: Position[] = [
  { id: '1', symbol: 'NIFTY', contract: 'NIFTY Mar 2025', direction: 'BUY', lots: 2, entryPrice: 19545.5, ltp: 19585.75, pnl: 4025 },
  { id: '2', symbol: 'BANKNIFTY', contract: 'BANKNIFTY Mar 2025', direction: 'SELL', lots: 3, entryPrice: 42680.0, ltp: 42610.25, pnl: 5231.25 },
  { id: '3', symbol: 'FINNIFTY', contract: 'FINNIFTY Apr 2025', direction: 'BUY', lots: 4, entryPrice: 20890.0, ltp: 20850.75, pnl: -3929 },
  { id: '4', symbol: 'NIFTY', contract: 'NIFTY Apr 2025', direction: 'BUY', lots: 1, entryPrice: 19625.0, ltp: 19610.5, pnl: -725 },
]

const stockList = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT']

// ─── Main Component ──────────────────────────────────────────────────
export function FuturesPage() {
  const [instrument, setInstrument] = useState<Instrument>('NIFTY')
  const [contractIdx, setContractIdx] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [direction, setDirection] = useState<Direction>('BUY')
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [lots, setLots] = useState(1)
  const [price, setPrice] = useState('')

  const config = INSTRUMENT_CONFIG[instrument]
  const contracts = useMemo(() => generateFuturesContracts(instrument), [instrument])
  const selectedContract = contracts[contractIdx]
  const priceData = useMemo(() => generatePriceData(config.spot), [config.spot])
  const availableMargin = 250000

  const totalQty = lots * selectedContract.lotSize
  const marginRequired = direction === 'BUY'
    ? Number((selectedContract.ltp * totalQty * 0.15).toFixed(0))
    : Number((selectedContract.ltp * totalQty * 0.2).toFixed(0))

  const basis = selectedContract.ltp - config.spot
  const basisPct = (basis / config.spot) * 100

  const instruments: Instrument[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY']
  const monthLabels = ['Current Month', 'Next Month', 'Far Month']

  const totalPnl = MOCK_POSITIONS.reduce((s, p) => s + p.pnl, 0)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <CandlestickChart className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-tp-on-surface">Futures Trading</h1>
          <p className="text-xs text-tp-on-surface-variant">Trade index & stock futures</p>
        </div>
      </div>

      {/* ── Instrument Selector ───────────────────────────────── */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {instruments.map((inst) => (
            <button
              key={inst}
              onClick={() => { setInstrument(inst); setContractIdx(0) }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
                instrument === inst
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-muted text-tp-on-surface-variant hover:bg-primary/10 hover:text-primary'
              )}
            >
              {inst}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-muted text-tp-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Search className="size-3.5" />
              Stocks
              <ChevronDown className="size-3" />
            </button>
            {searchOpen && (
              <div className="absolute top-full mt-2 right-0 z-50 w-72 glass-card rounded-xl shadow-xl border p-3">
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                  {stockList
                    .filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((stock) => (
                      <button
                        key={stock}
                        onClick={() => setSearchOpen(false)}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {stock}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contract Selector Tabs ─────────────────────────────── */}
      <div className="glass-card p-4 rounded-xl">
        <Tabs value={String(contractIdx)} onValueChange={(v) => setContractIdx(Number(v))}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            {monthLabels.map((label, idx) => (
              <TabsTrigger key={idx} value={String(idx)} className="text-xs md:text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {contracts.map((contract, idx) => (
            <TabsContent key={idx} value={String(idx)}>
              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                <div>
                  <div className="text-xs text-tp-on-surface-variant">Contract</div>
                  <div className="font-bold text-tp-on-surface text-sm">{contract.name}</div>
                </div>
                <div>
                  <div className="text-xs text-tp-on-surface-variant">LTP</div>
                  <div className="font-mono font-bold text-tp-on-surface">₹{contract.ltp.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-tp-on-surface-variant">Change</div>
                  <div className={cn(
                    'font-mono font-semibold text-sm',
                    contract.changePct > 0 ? 'text-emerald-600' : contract.changePct < 0 ? 'text-red-500' : 'text-tp-on-surface-variant'
                  )}>
                    {contract.changePct > 0 ? '+' : ''}{contract.changePct.toFixed(2)}%
                    <span className="ml-1 text-xs">({contract.change > 0 ? '+' : ''}{contract.change.toFixed(2)})</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-tp-on-surface-variant">OI</div>
                  <div className="font-mono text-sm text-tp-on-surface">{contract.oi}L</div>
                </div>
                <div>
                  <div className="text-xs text-tp-on-surface-variant">Volume</div>
                  <div className="font-mono text-sm text-tp-on-surface">{(contract.volume / 1000).toFixed(1)}K</div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* ── Main Trading Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Chart + Stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* Price Chart */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-tp-on-surface flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                {selectedContract.name} — Price Movement
              </h3>
              <Badge variant="outline" className="text-xs font-mono">
                Live
              </Badge>
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="futuresGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0058be" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    interval={9}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(1)}K`}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#0058be"
                    strokeWidth={2}
                    fill="url(#futuresGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="glass-card p-3 rounded-xl text-center">
              <div className="text-[10px] text-tp-on-surface-variant uppercase tracking-wider mb-1">LTP</div>
              <div className="font-mono font-bold text-tp-on-surface text-lg">₹{selectedContract.ltp.toLocaleString()}</div>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <div className="text-[10px] text-tp-on-surface-variant uppercase tracking-wider mb-1">Change</div>
              <div className={cn(
                'font-mono font-bold text-lg',
                selectedContract.changePct > 0 ? 'text-emerald-600' : 'text-red-500'
              )}>
                {selectedContract.changePct > 0 ? '+' : ''}{selectedContract.changePct.toFixed(2)}%
              </div>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <div className="text-[10px] text-tp-on-surface-variant uppercase tracking-wider mb-1">Open Interest</div>
              <div className="font-mono font-bold text-tp-on-surface text-lg">{selectedContract.oi}L</div>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <div className="text-[10px] text-tp-on-surface-variant uppercase tracking-wider mb-1">Volume</div>
              <div className="font-mono font-bold text-tp-on-surface text-lg">{(selectedContract.volume / 1000).toFixed(1)}K</div>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <div className="text-[10px] text-tp-on-surface-variant uppercase tracking-wider mb-1">Basis</div>
              <div className={cn(
                'font-mono font-bold text-lg',
                basis > 0 ? 'text-emerald-600' : 'text-red-500'
              )}>
                {basis > 0 ? '+' : ''}{basis.toFixed(2)}
                <span className="text-xs ml-1">({basisPct.toFixed(2)}%)</span>
              </div>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <div className="text-[10px] text-tp-on-surface-variant uppercase tracking-wider mb-1">Premium / Disc</div>
              <div className={cn(
                'font-mono font-bold text-lg',
                basis > 0 ? 'text-emerald-600' : 'text-red-500'
              )}>
                {basis > 0 ? 'Premium' : 'Discount'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="lg:col-span-2">
          <div className="glass-card p-4 rounded-xl space-y-4 sticky top-20">
            <h3 className="text-sm font-bold text-tp-on-surface flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              Place Order
            </h3>

            {/* BUY / SELL Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setDirection('BUY')}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                  direction === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100'
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
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100'
                )}
              >
                <ArrowDownRight className="size-4 inline mr-1" />
                SELL
              </button>
            </div>

            {/* Order Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
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
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-muted text-tp-on-surface-variant hover:bg-primary/5'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Lots Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                Lots
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 shrink-0"
                  onClick={() => setLots(Math.max(1, lots - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  type="number"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center font-mono text-lg font-bold h-10"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 shrink-0"
                  onClick={() => setLots(lots + 1)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {/* Price Input (for Limit/SL) */}
            {(orderType === 'LIMIT' || orderType === 'SL') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                  Price (₹)
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={selectedContract.ltp.toFixed(2)}
                  className="font-mono h-10"
                />
              </div>
            )}

            {/* Calculated Fields */}
            <div className="glass-card p-3 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-tp-on-surface-variant">Lot Size</span>
                <span className="font-mono font-medium">{selectedContract.lotSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tp-on-surface-variant">Total Qty</span>
                <span className="font-mono font-medium">{totalQty}</span>
              </div>
              <div className="flex justify-between border-t border-tp-outline-variant/20 pt-2">
                <span className="text-tp-on-surface-variant font-semibold">Margin Required</span>
                <span className="font-mono font-bold text-primary text-base">₹{Number(marginRequired).toLocaleString()}</span>
              </div>
            </div>

            {/* Available Margin */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/5">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-secondary" />
                <span className="text-xs font-medium text-tp-on-surface-variant">Available Margin</span>
              </div>
              <span className={cn(
                'font-mono font-bold text-sm',
                availableMargin >= marginRequired ? 'text-emerald-600' : 'text-red-500'
              )}>
                ₹{availableMargin.toLocaleString()}
              </span>
            </div>

            {/* Place Order Button */}
            <Button
              className={cn(
                'w-full py-3 font-bold text-base transition-all duration-200',
                direction === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              )}
            >
              {direction === 'BUY' ? (
                <><ArrowUpRight className="size-4 mr-2" />Place BUY Order</>
              ) : (
                <><ArrowDownRight className="size-4 mr-2" />Place SELL Order</>
              )}
            </Button>

            <p className="text-[10px] text-center text-tp-on-surface-variant flex items-center justify-center gap-1">
              <Info className="size-3" />
              Paper trading — No real money involved
            </p>
          </div>
        </div>
      </div>

      {/* ── Open Futures Positions ─────────────────────────────── */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-tp-on-surface flex items-center gap-2">
            <CandlestickChart className="size-4 text-primary" />
            Open Futures Positions
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-tp-on-surface-variant">Net P&L:</span>
            <span className={cn(
              'font-mono font-bold',
              totalPnl > 0 ? 'text-emerald-600' : 'text-red-500'
            )}>
              {totalPnl > 0 ? '+' : ''}₹{totalPnl.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tp-outline-variant/20 text-tp-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Contract</th>
                <th className="px-3 py-2 text-left">Direction</th>
                <th className="px-3 py-2 text-right">Lots</th>
                <th className="px-3 py-2 text-right">Entry Price</th>
                <th className="px-3 py-2 text-right">LTP</th>
                <th className="px-3 py-2 text-right">P&L</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POSITIONS.map((pos) => (
                <tr key={pos.id} className="border-b border-tp-outline-variant/10 hover:bg-primary/5 transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-tp-on-surface">{pos.symbol}</td>
                  <td className="px-3 py-2.5 text-tp-on-surface-variant">{pos.contract}</td>
                  <td className="px-3 py-2.5">
                    <Badge className={cn(
                      'text-xs font-bold',
                      pos.direction === 'BUY'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      {pos.direction === 'BUY' ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                      {pos.direction}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{pos.lots}</td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{pos.entryPrice.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{pos.ltp.toLocaleString()}</td>
                  <td className={cn(
                    'px-3 py-2.5 text-right font-mono font-bold',
                    pos.pnl > 0 ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {pos.pnl > 0 ? '+' : ''}₹{pos.pnl.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Button variant="outline" size="sm" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/20">
                      <X className="size-3 mr-1" />
                      Square Off
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {MOCK_POSITIONS.map((pos) => (
            <div key={pos.id} className="p-3 rounded-xl border border-tp-outline-variant/20 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-tp-on-surface">{pos.symbol}</span>
                  <Badge className={cn(
                    'text-[10px] font-bold',
                    pos.direction === 'BUY'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {pos.direction}
                  </Badge>
                </div>
                <span className={cn(
                  'font-mono font-bold',
                  pos.pnl > 0 ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {pos.pnl > 0 ? '+' : ''}₹{pos.pnl.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs text-tp-on-surface-variant">
                <span>{pos.contract} · {pos.lots} lot{pos.lots > 1 ? 's' : ''}</span>
                <span>₹{pos.entryPrice.toLocaleString()} → ₹{pos.ltp.toLocaleString()}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs h-7 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                <X className="size-3 mr-1" />
                Square Off
              </Button>
            </div>
          ))}
        </div>

        {MOCK_POSITIONS.length === 0 && (
          <div className="text-center py-8 text-tp-on-surface-variant text-sm">
            No open futures positions
          </div>
        )}
      </div>
    </div>
  )
}
