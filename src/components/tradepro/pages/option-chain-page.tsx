'use client'

import { useState, useMemo } from 'react'
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronDown,
  X,
  Activity,
  Shield,
  Target,
  BarChart3,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Types ───────────────────────────────────────────────────────────
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

type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX' | 'MIDCPNIFTY'

// ─── Mock Data Generators ────────────────────────────────────────────
function generateMockData(spotPrice: number, instrument: Instrument): OptionRow[] {
  const strikes: number[] = []
  const step = instrument === 'SENSEX' ? 100 : 50
  const range = 500
  const startStrike = Math.floor((spotPrice - range) / step) * step
  const endStrike = Math.ceil((spotPrice + range) / step) * step

  for (let s = startStrike; s <= endStrike; s += step) {
    strikes.push(s)
  }

  return strikes.map((strike) => {
    const diffFromSpot = strike - spotPrice
    const isATM = Math.abs(diffFromSpot) < step / 2

    // CE: In-the-money when strike < spot
    const ceITM = strike < spotPrice
    const ceIntrinsic = ceITM ? spotPrice - strike : 0
    const ceTimeValue = Math.max(50, (250 - Math.abs(diffFromSpot) * 0.3) * (isATM ? 1.2 : 1))
    const ceLTP = Math.max(0.05, ceIntrinsic + ceTimeValue * (0.6 + Math.random() * 0.8))
    const ceChngPct = (Math.random() - 0.5) * 20
    const ceIV = Math.max(5, 18 - diffFromSpot * 0.01 + Math.random() * 8)
    const ceOI = Math.max(0.5, (isATM ? 80 : 40 - Math.abs(diffFromSpot) * 0.04) * (0.5 + Math.random()))
    const ceOIChngPct = (Math.random() - 0.4) * 30
    const ceVolume = Math.max(100, ceOI * 1000 * (0.3 + Math.random() * 0.7))

    // PE: In-the-money when strike > spot
    const peITM = strike > spotPrice
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

const INSTRUMENT_CONFIG: Record<Instrument, { spot: number; step: number }> = {
  NIFTY: { spot: 19500.25, step: 50 },
  BANKNIFTY: { spot: 42500.5, step: 100 },
  FINNIFTY: { spot: 20850.75, step: 50 },
  SENSEX: { spot: 64800.0, step: 100 },
  MIDCPNIFTY: { spot: 12250.0, step: 50 },
}

const EXPIRIES = [
  { label: '27 Mar 2025', type: 'Weekly' },
  { label: '03 Apr 2025', type: 'Weekly' },
  { label: '24 Apr 2025', type: 'Monthly' },
  { label: '29 May 2025', type: 'Monthly' },
  { label: '26 Jun 2025', type: 'Monthly' },
]

// ─── OI Change Color Helper ─────────────────────────────────────────
function getOIColorClass(pct: number): string {
  if (pct > 10) return 'bg-red-500/20 text-red-700 dark:text-red-400'
  if (pct > 5) return 'bg-orange-400/20 text-orange-700 dark:text-orange-400'
  if (pct > 2) return 'bg-yellow-400/20 text-yellow-700 dark:text-yellow-400'
  if (pct > -2) return ''
  if (pct > -5) return 'bg-blue-400/15 text-blue-700 dark:text-blue-400'
  return 'bg-red-700/20 text-red-900 dark:text-red-300'
}

// ─── Quick Trade Modal ───────────────────────────────────────────────
function QuickTradeModal({
  open,
  onClose,
  row,
  side,
  spotPrice,
}: {
  open: boolean
  onClose: () => void
  row: OptionRow | null
  side: 'CE' | 'PE'
  spotPrice: number
}) {
  if (!row) return null

  const ltp = side === 'CE' ? row.ceLTP : row.peLTP
  const isBuy = true // Default to BUY view

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary font-bold">
              {side === 'CE' ? 'CALL' : 'PUT'} Option
            </span>
            <Badge variant="outline" className="font-mono">
              Strike ₹{row.strike.toLocaleString()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Option Info */}
          <div className="glass-card p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-tp-on-surface-variant">Spot Price</span>
              <span className="font-mono font-semibold">₹{spotPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-tp-on-surface-variant">LTP</span>
              <span className="font-mono font-semibold">₹{ltp.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-tp-on-surface-variant">IV</span>
              <span className="font-mono">{side === 'CE' ? row.ceIV : row.peIV}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-tp-on-surface-variant">OI</span>
              <span className="font-mono">{(side === 'CE' ? row.ceOI : row.peOI).toFixed(1)} L</span>
            </div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="flex gap-2">
            <Button
              className={cn(
                'flex-1 font-bold',
                isBuy ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              BUY
            </Button>
            <Button
              className={cn(
                'flex-1 font-bold',
                !isBuy ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              SELL
            </Button>
          </div>

          {/* Lots Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-tp-on-surface-variant">Lots</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-9">
                <Minus className="size-3" />
              </Button>
              <Input type="number" defaultValue={1} className="text-center font-mono" />
              <Button variant="outline" size="icon" className="size-9">
                <TrendingUp className="size-3" />
              </Button>
            </div>
          </div>

          {/* Calculated Fields */}
          <div className="glass-card p-4 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-tp-on-surface-variant">Lot Size</span>
              <span className="font-mono font-medium">50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tp-on-surface-variant">Total Qty</span>
              <span className="font-mono font-medium">50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tp-on-surface-variant">Margin Required</span>
              <span className="font-mono font-bold text-primary">₹{(ltp * 50 * 1.2).toFixed(0)}</span>
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3">
            Place BUY Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export function OptionChainPage() {
  const [instrument, setInstrument] = useState<Instrument>('NIFTY')
  const [expiryIdx, setExpiryIdx] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRow, setSelectedRow] = useState<OptionRow | null>(null)
  const [selectedSide, setSelectedSide] = useState<'CE' | 'PE'>('CE')
  const [modalOpen, setModalOpen] = useState(false)

  const config = INSTRUMENT_CONFIG[instrument]
  const spotPrice = config.spot
  const data = useMemo(() => generateMockData(spotPrice, instrument), [spotPrice, instrument])

  // Derived stats
  const totalCEOI = data.reduce((s, r) => s + r.ceOI, 0)
  const totalPEOI = data.reduce((s, r) => s + r.peOI, 0)
  const pcr = totalPEOI / totalCEOI

  // Max Pain calculation (simplified)
  const maxPainStrike = data.reduce(
    (max, r) => {
      const pain = data.reduce((acc, d) => {
        const cePain = d.strike < r.strike ? (r.strike - d.strike) * d.ceOI : 0
        const pePain = d.strike > r.strike ? (d.strike - r.strike) * d.peOI : 0
        return acc + cePain + pePain
      }, 0)
      return pain > max.pain ? { strike: r.strike, pain } : max
    },
    { strike: 0, pain: 0 }
  ).strike

  // Highest OI strikes
  const highestCEOI = data.reduce((max, r) => (r.ceOI > max.ceOI ? r : max), data[0])
  const highestPEOI = data.reduce((max, r) => (r.peOI > max.peOI ? r : max), data[0])

  // Top 5 OI by strike
  const top5CE = [...data].sort((a, b) => b.ceOI - a.ceOI).slice(0, 5)
  const top5PE = [...data].sort((a, b) => b.peOI - a.peOI).slice(0, 5)

  const handleRowClick = (row: OptionRow, side: 'CE' | 'PE') => {
    setSelectedRow(row)
    setSelectedSide(side)
    setModalOpen(true)
  }

  const instruments: Instrument[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY']
  const stockList = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT']

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <GitBranch className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-tp-on-surface">Option Chain</h1>
          <p className="text-xs text-tp-on-surface-variant">Real-time options data & analysis</p>
        </div>
      </div>

      {/* ── Instrument Selector ───────────────────────────────── */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {instruments.map((inst) => (
            <button
              key={inst}
              onClick={() => setInstrument(inst)}
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
                        onClick={() => {
                          setSearchOpen(false)
                          setSearchQuery('')
                        }}
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

      {/* ── Expiry Selector ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-tp-on-surface-variant mr-1">Expiry:</span>
        {EXPIRIES.map((exp, idx) => (
          <button
            key={exp.label}
            onClick={() => setExpiryIdx(idx)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
              expiryIdx === idx
                ? 'bg-secondary text-white shadow-md'
                : 'bg-muted text-tp-on-surface-variant hover:bg-secondary/10 hover:text-secondary'
            )}
          >
            {exp.label}
            <span className="ml-1 opacity-70">({exp.type})</span>
          </button>
        ))}
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <div className="glass-card p-3 rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Target className="size-3.5 text-primary" />
          <span className="text-tp-on-surface-variant">Spot:</span>
          <span className="font-mono font-bold text-tp-on-surface">₹{spotPrice.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-secondary" />
          <span className="text-tp-on-surface-variant">PCR:</span>
          <span className={cn('font-mono font-bold', pcr > 1 ? 'text-emerald-600' : pcr < 0.7 ? 'text-red-600' : 'text-tp-on-surface')}>
            {pcr.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-tertiary" />
          <span className="text-tp-on-surface-variant">Max Pain:</span>
          <span className="font-mono font-bold text-tp-on-surface">{maxPainStrike.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="size-3.5 text-orange-500" />
          <span className="text-tp-on-surface-variant">India VIX:</span>
          <span className="font-mono font-bold text-tp-on-surface">14.25</span>
          <span className="text-xs text-red-500 font-semibold">▲ +2.3%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Info className="size-3.5 text-blue-500" />
          <span className="text-tp-on-surface-variant">Total OI:</span>
          <span className="font-mono font-bold text-tp-on-surface">
            {((totalCEOI + totalPEOI) / 100).toFixed(1)} Cr
          </span>
        </div>
      </div>

      {/* ── Option Chain Table ─────────────────────────────────── */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-primary/5 border-b border-tp-outline-variant/30">
                <th colSpan={6} className="text-center py-2 text-primary font-bold text-xs uppercase tracking-wider">
                  Call Options (CE)
                </th>
                <th className="text-center py-2 bg-muted/50 font-bold text-tp-on-surface border-x border-tp-outline-variant/20">
                  Strike
                </th>
                <th colSpan={6} className="text-center py-2 text-tertiary font-bold text-xs uppercase tracking-wider">
                  Put Options (PE)
                </th>
              </tr>
              <tr className="border-b border-tp-outline-variant/30 text-tp-on-surface-variant">
                <th className="px-2 py-2 text-right font-semibold">OI (L)</th>
                <th className="px-2 py-2 text-right font-semibold">OI Chg%</th>
                <th className="px-2 py-2 text-right font-semibold">LTP</th>
                <th className="px-2 py-2 text-right font-semibold">Chg%</th>
                <th className="px-2 py-2 text-right font-semibold">IV</th>
                <th className="px-2 py-2 text-right font-semibold">Vol</th>
                <th className="px-2 py-2 text-center font-bold bg-muted/50 border-x border-tp-outline-variant/20 text-tp-on-surface">
                  ₹
                </th>
                <th className="px-2 py-2 text-left font-semibold">Vol</th>
                <th className="px-2 py-2 text-left font-semibold">IV</th>
                <th className="px-2 py-2 text-left font-semibold">Chg%</th>
                <th className="px-2 py-2 text-left font-semibold">LTP</th>
                <th className="px-2 py-2 text-left font-semibold">OI Chg%</th>
                <th className="px-2 py-2 text-left font-semibold">OI (L)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const isATM = row.strike === Math.round(spotPrice / config.step) * config.step
                const ceITM = row.strike < spotPrice
                const peITM = row.strike > spotPrice

                return (
                  <tr
                    key={row.strike}
                    className={cn(
                      'border-b border-tp-outline-variant/10 transition-colors hover:bg-primary/5 cursor-pointer',
                      isATM && 'bg-yellow-100/60 dark:bg-yellow-900/30'
                    )}
                  >
                    {/* CE Side */}
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono',
                        ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'CE')}
                    >
                      {row.ceOI.toFixed(1)}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono text-xs',
                        getOIColorClass(row.ceOIChngPct),
                        ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'CE')}
                    >
                      {row.ceOIChngPct > 0 ? '+' : ''}{row.ceOIChngPct.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono font-semibold',
                        ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'CE')}
                    >
                      {row.ceLTP.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono text-xs',
                        row.ceChngPct > 0 ? 'text-emerald-600' : row.ceChngPct < 0 ? 'text-red-500' : 'text-tp-on-surface-variant',
                        ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'CE')}
                    >
                      {row.ceChngPct > 0 ? '+' : ''}{row.ceChngPct.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono',
                        ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'CE')}
                    >
                      {row.ceIV.toFixed(1)}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-right font-mono text-tp-on-surface-variant',
                        ceITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'CE')}
                    >
                      {(row.ceVolume / 1000).toFixed(0)}K
                    </td>

                    {/* Strike */}
                    <td
                      className={cn(
                        'px-3 py-1.5 text-center font-mono font-bold text-sm',
                        'bg-muted/50 border-x border-tp-outline-variant/20',
                        isATM
                          ? 'bg-yellow-200/80 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100'
                          : 'text-tp-on-surface'
                      )}
                    >
                      {row.strike.toLocaleString()}
                      {isATM && (
                        <span className="ml-1 text-[9px] font-bold text-yellow-700 dark:text-yellow-300">ATM</span>
                      )}
                    </td>

                    {/* PE Side */}
                    <td
                      className={cn(
                        'px-2 py-1.5 text-left font-mono text-tp-on-surface-variant',
                        peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'PE')}
                    >
                      {(row.peVolume / 1000).toFixed(0)}K
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-left font-mono',
                        peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'PE')}
                    >
                      {row.peIV.toFixed(1)}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-left font-mono text-xs',
                        row.peChngPct > 0 ? 'text-emerald-600' : row.peChngPct < 0 ? 'text-red-500' : 'text-tp-on-surface-variant',
                        peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'PE')}
                    >
                      {row.peChngPct > 0 ? '+' : ''}{row.peChngPct.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-left font-mono font-semibold',
                        peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'PE')}
                    >
                      {row.peLTP.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-left font-mono text-xs',
                        getOIColorClass(row.peOIChngPct),
                        peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'PE')}
                    >
                      {row.peOIChngPct > 0 ? '+' : ''}{row.peOIChngPct.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 text-left font-mono',
                        peITM && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleRowClick(row, 'PE')}
                    >
                      {row.peOI.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── OI Analysis Section ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CE OI by Strike */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-bold text-tp-on-surface mb-3 flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            CE OI by Strike (Top 5)
          </h3>
          <div className="space-y-2.5">
            {top5CE.map((row) => {
              const maxOI = top5CE[0].ceOI
              const widthPct = (row.ceOI / maxOI) * 100
              return (
                <div key={row.strike} className="flex items-center gap-3">
                  <span className="w-16 text-right text-xs font-mono font-semibold text-tp-on-surface-variant shrink-0">
                    {row.strike.toLocaleString()}
                  </span>
                  <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{row.ceOI.toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* PE OI by Strike */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-bold text-tp-on-surface mb-3 flex items-center gap-2">
            <div className="size-2 rounded-full bg-tertiary" />
            PE OI by Strike (Top 5)
          </h3>
          <div className="space-y-2.5">
            {top5PE.map((row) => {
              const maxOI = top5PE[0].peOI
              const widthPct = (row.peOI / maxOI) * 100
              return (
                <div key={row.strike} className="flex items-center gap-3">
                  <span className="w-16 text-right text-xs font-mono font-semibold text-tp-on-surface-variant shrink-0">
                    {row.strike.toLocaleString()}
                  </span>
                  <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-tertiary/70 to-tertiary flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{row.peOI.toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── PCR Analysis & Key Levels ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PCR Gauge */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-bold text-tp-on-surface mb-4 flex items-center gap-2">
            <Activity className="size-4 text-secondary" />
            PCR Analysis
          </h3>
          <div className="flex flex-col items-center">
            {/* Gauge Meter */}
            <div className="relative w-48 h-24 mb-3">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 20 90 A 80 80 0 0 1 180 90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted"
                  strokeLinecap="round"
                />
                {/* Colored segments */}
                <path
                  d="M 20 90 A 80 80 0 0 1 80 16"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 80 16 A 80 80 0 0 1 120 16"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 120 16 A 80 80 0 0 1 180 90"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Needle */}
                {(() => {
                  const pcrNorm = Math.min(Math.max(pcr, 0.3), 1.7)
                  const angle = ((pcrNorm - 0.3) / 1.4) * 180
                  const rad = (angle * Math.PI) / 180
                  const nx = 100 - 65 * Math.cos(rad)
                  const ny = 90 - 65 * Math.sin(rad)
                  return (
                    <>
                      <line
                        x1="100"
                        y1="90"
                        x2={nx}
                        y2={ny}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-tp-on-surface"
                      />
                      <circle cx="100" cy="90" r="5" className="fill-tp-on-surface" />
                    </>
                  )
                })()}
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-0">
                <span className={cn(
                  'text-2xl font-bold font-mono',
                  pcr > 1 ? 'text-emerald-600' : pcr < 0.7 ? 'text-red-600' : 'text-amber-600'
                )}>
                  {pcr.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Labels */}
            <div className="flex justify-between w-48 text-[10px] text-tp-on-surface-variant mb-3">
              <span>Bearish (0.3)</span>
              <span>Neutral</span>
              <span>Bullish (1.7)</span>
            </div>
            {/* Interpretation */}
            <div className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              pcr > 1 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
              pcr < 0.7 ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
              'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
            )}>
              {pcr > 1
                ? '📈 Bullish Sentiment — Put writing exceeds Call writing'
                : pcr < 0.7
                  ? '📉 Bearish Sentiment — Call writing exceeds Put writing'
                  : '⚖️ Neutral Sentiment — Balanced option writing'
              }
            </div>
          </div>
        </div>

        {/* Key Levels */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-bold text-tp-on-surface mb-4 flex items-center gap-2">
            <Target className="size-4 text-primary" />
            Key Levels & Support/Resistance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <span className="text-sm font-medium text-tp-on-surface-variant">Max Pain</span>
              </div>
              <span className="font-mono font-bold text-primary">{maxPainStrike.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-tertiary/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-tertiary" />
                <span className="text-sm font-medium text-tp-on-surface-variant">Highest CE OI (Resistance)</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-tertiary">{highestCEOI.strike.toLocaleString()}</span>
                <span className="text-xs text-tp-on-surface-variant ml-1">({highestCEOI.ceOI.toFixed(1)}L)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/5">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-4 text-secondary" />
                <span className="text-sm font-medium text-tp-on-surface-variant">Highest PE OI (Support)</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-secondary">{highestPEOI.strike.toLocaleString()}</span>
                <span className="text-xs text-tp-on-surface-variant ml-1">({highestPEOI.peOI.toFixed(1)}L)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <span className="text-sm font-medium text-tp-on-surface-variant">PCR Interpretation</span>
              </div>
              <span className={cn(
                'text-sm font-semibold',
                pcr > 1 ? 'text-emerald-600' : pcr < 0.7 ? 'text-red-600' : 'text-amber-600'
              )}>
                {pcr > 1 ? 'Bullish Bias' : pcr < 0.7 ? 'Bearish Bias' : 'Neutral'}
              </span>
            </div>

            {/* Range Box */}
            <div className="p-3 rounded-lg border border-tp-outline-variant/30 bg-muted/20">
              <div className="text-xs text-tp-on-surface-variant mb-1 font-medium">Expected Range</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-secondary">{highestPEOI.strike.toLocaleString()}</span>
                <span className="text-tp-on-surface-variant">—</span>
                <span className="font-mono text-lg font-bold text-tertiary">{highestCEOI.strike.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-tp-on-surface-variant mt-1">
                <span>Support</span>
                <span>Resistance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Trade Modal ──────────────────────────────────── */}
      <QuickTradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        row={selectedRow}
        side={selectedSide}
        spotPrice={spotPrice}
      />
    </div>
  )
}
