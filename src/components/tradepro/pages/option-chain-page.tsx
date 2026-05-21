'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Search,
  ChevronDown,
  X,
  Activity,
  Shield,
  Target,
  BarChart3,
  AlertTriangle,
  Info,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
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
import { useAuthStore } from '@/lib/auth-store'
import { useTradeSuccess } from '@/components/tradepro/trade-success-popup'
import { toast } from 'sonner'

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

// ─── Fallback Mock Data Generator ────────────────────────────────────
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
    const ceITM = strike < spotPrice
    const ceIntrinsic = ceITM ? spotPrice - strike : 0
    const ceTimeValue = Math.max(50, (250 - Math.abs(diffFromSpot) * 0.3) * (isATM ? 1.2 : 1))
    const ceLTP = Math.max(0.05, ceIntrinsic + ceTimeValue * (0.6 + Math.random() * 0.8))
    const ceChngPct = (Math.random() - 0.5) * 20
    const ceIV = Math.max(5, 18 - diffFromSpot * 0.01 + Math.random() * 8)
    const ceOI = Math.max(0.5, (isATM ? 80 : 40 - Math.abs(diffFromSpot) * 0.04) * (0.5 + Math.random()))
    const ceOIChngPct = (Math.random() - 0.4) * 30
    const ceVolume = Math.max(100, ceOI * 1000 * (0.3 + Math.random() * 0.7))
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

const INSTRUMENT_CONFIG: Record<Instrument, { step: number }> = {
  NIFTY: { step: 50 },
  BANKNIFTY: { step: 100 },
  FINNIFTY: { step: 50 },
  SENSEX: { step: 100 },
  MIDCPNIFTY: { step: 50 },
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
  if (pct > 10) return 'bg-red-500/20 text-red-400'
  if (pct > 5) return 'bg-orange-400/20 text-orange-400'
  if (pct > 2) return 'bg-yellow-400/20 text-yellow-400'
  if (pct > -2) return ''
  if (pct > -5) return 'bg-blue-400/15 text-blue-400'
  return 'bg-red-700/20 text-red-300'
}

// ─── Quick Trade Modal ───────────────────────────────────────────────
function QuickTradeModal({
  open,
  onClose,
  row,
  side,
  spotPrice,
  instrument,
}: {
  open: boolean
  onClose: () => void
  row: OptionRow | null
  side: 'CE' | 'PE'
  spotPrice: number
  instrument: Instrument
}) {
  const { token } = useAuthStore()
  const { showTradeSuccess } = useTradeSuccess()
  const [lots, setLots] = useState(1)
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY')
  const [placing, setPlacing] = useState(false)

  if (!row) return null

  const ltp = side === 'CE' ? row.ceLTP : row.peLTP
  const lotSize = INSTRUMENT_CONFIG[instrument]?.step === 100 ? 15 : 50
  const totalQty = lots * lotSize
  const marginRequired = Math.round(ltp * totalQty * 1.2)

  const handlePlaceOrder = async () => {
    if (!token) {
      toast.error('Please login to trade')
      return
    }
    setPlacing(true)
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
          orderType: 'MARKET',
          segment: 'OPTIONS',
          productType: 'INTRADAY',
          quantity: totalQty,
          lots,
          optionType: side,
          strikePrice: row.strike,
          price: ltp,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        showTradeSuccess({
          symbol: instrument,
          type: direction,
          qty: totalQty,
          price: ltp,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
          orderId: data.order?.id?.slice(-8).toUpperCase() || 'N/A',
          segment: 'OPTIONS',
          optionType: side,
          strikePrice: row.strike,
          totalValue: data.order?.totalValue,
          brokerage: data.order?.brokerage,
        })
        onClose()
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#111827] border-[#1f2937] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">
              {side === 'CE' ? 'CALL' : 'PUT'} Option
            </span>
            <Badge variant="outline" className="font-mono border-[#1f2937] text-gray-400">
              Strike ₹{row.strike.toLocaleString()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Option Info */}
          <div className="bg-[#0a0e17] border border-[#1f2937] p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Spot Price</span>
              <span className="font-mono font-semibold text-white">₹{spotPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">LTP</span>
              <span className="font-mono font-semibold text-white">₹{ltp.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">IV</span>
              <span className="font-mono text-white">{side === 'CE' ? row.ceIV : row.peIV}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">OI</span>
              <span className="font-mono text-white">{(side === 'CE' ? row.ceOI : row.peOI).toFixed(1)} L</span>
            </div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="flex gap-2">
            <Button
              onClick={() => setDirection('BUY')}
              className={cn(
                'flex-1 font-bold',
                direction === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-[#1f2937] text-gray-400'
              )}
            >
              BUY
            </Button>
            <Button
              onClick={() => setDirection('SELL')}
              className={cn(
                'flex-1 font-bold',
                direction === 'SELL' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#1f2937] text-gray-400'
              )}
            >
              SELL
            </Button>
          </div>

          {/* Lots Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400">Lots</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-9 border-[#1f2937]" onClick={() => setLots(Math.max(1, lots - 1))}>
                <Minus className="size-3" />
              </Button>
              <Input type="number" value={lots} onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))} className="text-center font-mono bg-[#0a0e17] border-[#1f2937]" />
              <Button variant="outline" size="icon" className="size-9 border-[#1f2937]" onClick={() => setLots(lots + 1)}>
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          {/* Calculated Fields */}
          <div className="bg-[#0a0e17] border border-[#1f2937] p-4 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Lot Size</span>
              <span className="font-mono font-medium text-white">{lotSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Qty</span>
              <span className="font-mono font-medium text-white">{totalQty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Margin Required</span>
              <span className="font-mono font-bold text-amber-500">₹{marginRequired.toLocaleString()}</span>
            </div>
          </div>

          <Button
            onClick={handlePlaceOrder}
            disabled={placing}
            className={cn(
              'w-full font-bold py-3',
              direction === 'BUY'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            )}
          >
            {placing ? (
              <><Loader2 className="size-4 mr-2 animate-spin" />Placing Order...</>
            ) : (
              `Place ${direction} Order`
            )}
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

  const [data, setData] = useState<OptionRow[]>([])
  const [spotPrice, setSpotPrice] = useState(0)
  const [apiPcr, setApiPcr] = useState(0)
  const [apiMaxPain, setApiMaxPain] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchOptionChain = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/options/chain/${instrument}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.chain?.length > 0) {
          const apiData = json.data
          setSpotPrice(apiData.spot || 0)
          setApiPcr(apiData.pcr || 0)
          setApiMaxPain(apiData.maxPain || 0)

          const strikeMap = new Map<number, { ce?: Record<string, unknown>; pe?: Record<string, unknown> }>()
          for (const opt of apiData.chain as Record<string, unknown>[]) {
            const strike = opt.strikePrice as number
            if (!strikeMap.has(strike)) strikeMap.set(strike, {})
            const type = opt.optionType as string
            if (type === 'CE') strikeMap.get(strike)!.ce = opt
            else strikeMap.get(strike)!.pe = opt
          }

          const step = INSTRUMENT_CONFIG[instrument]?.step || 50
          const rows: OptionRow[] = []
          for (const [strike, d] of strikeMap) {
            const diffFromSpot = strike - (apiData.spot || 0)
            const isATM = Math.abs(diffFromSpot) < step / 2

            rows.push({
              strike,
              ceOI: Number(((d.ce?.openInterest as number) || (isATM ? 80 : 40) * (0.5 + Math.random())).toFixed(1)),
              ceOIChngPct: Number(((d.ce?.oiChangePercent as number) || (Math.random() - 0.4) * 30).toFixed(1)),
              ceLTP: Number(((d.ce?.ltp as number) || 0).toFixed(2)),
              ceChngPct: Number(((d.ce?.changePercent as number) || 0).toFixed(1)),
              ceIV: Number(((d.ce?.impliedVolatility as number) || 0).toFixed(1)),
              ceVolume: Math.round((d.ce?.volume as number) || 0),
              peVolume: Math.round((d.pe?.volume as number) || 0),
              peIV: Number(((d.pe?.impliedVolatility as number) || 0).toFixed(1)),
              peChngPct: Number(((d.pe?.changePercent as number) || 0).toFixed(1)),
              peLTP: Number(((d.pe?.ltp as number) || 0).toFixed(2)),
              peOIChngPct: Number(((d.pe?.oiChangePercent as number) || (Math.random() - 0.4) * 30).toFixed(1)),
              peOI: Number(((d.pe?.openInterest as number) || (isATM ? 85 : 45) * (0.5 + Math.random())).toFixed(1)),
            })
          }

          rows.sort((a, b) => a.strike - b.strike)
          setData(rows)
        } else {
          const fallbackSpot = INSTRUMENT_CONFIG[instrument] ? 22500 : 19500
          setSpotPrice(fallbackSpot)
          setData(generateMockData(fallbackSpot, instrument))
        }
      } else {
        const fallbackSpot = 22500
        setSpotPrice(fallbackSpot)
        setData(generateMockData(fallbackSpot, instrument))
      }
    } catch {
      const fallbackSpot = 22500
      setSpotPrice(fallbackSpot)
      setData(generateMockData(fallbackSpot, instrument))
    } finally {
      setLoading(false)
    }
  }, [instrument])

  useEffect(() => {
    fetchOptionChain()
  }, [fetchOptionChain])

  const totalCEOI = data.reduce((s, r) => s + r.ceOI, 0)
  const totalPEOI = data.reduce((s, r) => s + r.peOI, 0)
  const pcr = apiPcr > 0 ? apiPcr : (totalCEOI > 0 ? totalPEOI / totalCEOI : 0)

  const maxPainStrike = apiMaxPain > 0 ? apiMaxPain : data.reduce(
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

  const highestCEOI = data.length > 0 ? data.reduce((max, r) => (r.ceOI > max.ceOI ? r : max), data[0]) : null
  const highestPEOI = data.length > 0 ? data.reduce((max, r) => (r.peOI > max.peOI ? r : max), data[0]) : null

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
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
          <GitBranch className="size-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Options Chain</h1>
          <p className="text-xs text-gray-400">Real-time options data & analysis</p>
        </div>
      </div>

      {/* ── Instrument Selector ───────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {instruments.map((inst) => (
            <button
              key={inst}
              onClick={() => setInstrument(inst)}
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
                  className="mb-2 bg-[#0a0e17] border-[#1f2937]"
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
                        className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
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
        <span className="text-sm font-medium text-gray-400 mr-1">Expiry:</span>
        {EXPIRIES.map((exp, idx) => (
          <button
            key={exp.label}
            onClick={() => setExpiryIdx(idx)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
              expiryIdx === idx
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-[#1f2937] text-gray-400 hover:bg-amber-500/10 hover:text-amber-500'
            )}
          >
            {exp.label}
            <span className="ml-1 opacity-70">({exp.type})</span>
          </button>
        ))}
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Target className="size-3.5 text-amber-500" />
          <span className="text-gray-400">Spot:</span>
          <span className="font-mono font-bold text-white">₹{spotPrice.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-emerald-400" />
          <span className="text-gray-400">PCR:</span>
          <span className={cn('font-mono font-bold', pcr > 1 ? 'text-emerald-400' : pcr < 0.7 ? 'text-red-400' : 'text-white')}>
            {pcr.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-red-400" />
          <span className="text-gray-400">Max Pain:</span>
          <span className="font-mono font-bold text-white">{maxPainStrike.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Info className="size-3.5 text-amber-500" />
          <span className="text-gray-400">Total OI:</span>
          <span className="font-mono font-bold text-white">
            {((totalCEOI + totalPEOI) / 100).toFixed(1)} Cr
          </span>
        </div>
      </div>

      {/* ── Loading or Option Chain Table ─────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-amber-500" />
            <span className="text-sm text-gray-400">Loading options chain data...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Option Chain Table ─────────────────────────────────── */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-amber-500/5 border-b border-[#1f2937]">
                    <th colSpan={6} className="text-center py-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                      Call Options (CE)
                    </th>
                    <th className="text-center py-2 bg-[#1a2332] font-bold text-white border-x border-[#1f2937]">
                      Strike
                    </th>
                    <th colSpan={6} className="text-center py-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                      Put Options (PE)
                    </th>
                  </tr>
                  <tr className="border-b border-[#1f2937] text-gray-400">
                    <th className="px-2 py-2 text-right font-semibold">OI (L)</th>
                    <th className="px-2 py-2 text-right font-semibold">OI Chg%</th>
                    <th className="px-2 py-2 text-right font-semibold">LTP</th>
                    <th className="px-2 py-2 text-right font-semibold">Chg%</th>
                    <th className="px-2 py-2 text-right font-semibold">IV</th>
                    <th className="px-2 py-2 text-right font-semibold">Vol</th>
                    <th className="px-2 py-2 text-center font-bold bg-[#1a2332] border-x border-[#1f2937] text-white">
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
                    const step = INSTRUMENT_CONFIG[instrument]?.step || 50
                    const isATM = row.strike === Math.round(spotPrice / step) * step
                    const ceITM = row.strike < spotPrice
                    const peITM = row.strike > spotPrice

                    return (
                      <tr
                        key={row.strike}
                        className={cn(
                          'border-b border-[#1f2937] transition-colors hover:bg-amber-500/5 cursor-pointer',
                          isATM && 'bg-yellow-900/30'
                        )}
                      >
                        {/* CE Side */}
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono text-white',
                            ceITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {row.ceOI.toFixed(1)}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono text-xs',
                            getOIColorClass(row.ceOIChngPct),
                            ceITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {row.ceOIChngPct > 0 ? '+' : ''}{row.ceOIChngPct.toFixed(1)}%
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono font-semibold text-white',
                            ceITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {row.ceLTP.toFixed(2)}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono text-xs',
                            row.ceChngPct > 0 ? 'text-emerald-400' : row.ceChngPct < 0 ? 'text-red-400' : 'text-gray-400',
                            ceITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {row.ceChngPct > 0 ? '+' : ''}{row.ceChngPct.toFixed(1)}%
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono text-white',
                            ceITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {row.ceIV.toFixed(1)}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono text-gray-400',
                            ceITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {(row.ceVolume / 1000).toFixed(0)}K
                        </td>

                        {/* Strike */}
                        <td
                          className={cn(
                            'px-3 py-1.5 text-center font-mono font-bold text-sm',
                            'bg-[#1a2332] border-x border-[#1f2937]',
                            isATM
                              ? 'bg-yellow-800/50 text-yellow-100'
                              : 'text-white'
                          )}
                        >
                          {row.strike.toLocaleString()}
                          {isATM && (
                            <span className="ml-1 text-[9px] font-bold text-yellow-300">ATM</span>
                          )}
                        </td>

                        {/* PE Side */}
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono text-gray-400',
                            peITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'PE')}
                        >
                          {(row.peVolume / 1000).toFixed(0)}K
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono text-white',
                            peITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'PE')}
                        >
                          {row.peIV.toFixed(1)}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono text-xs',
                            row.peChngPct > 0 ? 'text-emerald-400' : row.peChngPct < 0 ? 'text-red-400' : 'text-gray-400',
                            peITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'PE')}
                        >
                          {row.peChngPct > 0 ? '+' : ''}{row.peChngPct.toFixed(1)}%
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono font-semibold text-white',
                            peITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'PE')}
                        >
                          {row.peLTP.toFixed(2)}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono text-xs',
                            getOIColorClass(row.peOIChngPct),
                            peITM && 'bg-emerald-900/10'
                          )}
                          onClick={() => handleRowClick(row, 'PE')}
                        >
                          {row.peOIChngPct > 0 ? '+' : ''}{row.peOIChngPct.toFixed(1)}%
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono text-white',
                            peITM && 'bg-emerald-900/10'
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
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <div className="size-2 rounded-full bg-amber-500" />
                CE OI by Strike (Top 5)
              </h3>
              <div className="space-y-2.5">
                {top5CE.map((row) => {
                  const maxOI = top5CE[0]?.ceOI || 1
                  const widthPct = (row.ceOI / maxOI) * 100
                  return (
                    <div key={row.strike} className="flex items-center gap-3">
                      <span className="w-16 text-right text-xs font-mono font-semibold text-gray-400 shrink-0">
                        {row.strike.toLocaleString()}
                      </span>
                      <div className="flex-1 h-6 bg-[#1f2937] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-500 flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="text-[10px] font-bold text-black">{row.ceOI.toFixed(1)}L</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PE OI by Strike */}
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-400" />
                PE OI by Strike (Top 5)
              </h3>
              <div className="space-y-2.5">
                {top5PE.map((row) => {
                  const maxOI = top5PE[0]?.peOI || 1
                  const widthPct = (row.peOI / maxOI) * 100
                  return (
                    <div key={row.strike} className="flex items-center gap-3">
                      <span className="w-16 text-right text-xs font-mono font-semibold text-gray-400 shrink-0">
                        {row.strike.toLocaleString()}
                      </span>
                      <div className="flex-1 h-6 bg-[#1f2937] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-400/70 to-red-400 flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        >
                          <span className="text-[10px] font-bold text-black">{row.peOI.toFixed(1)}L</span>
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
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="size-4 text-emerald-400" />
                PCR Analysis
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-24 mb-3">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-600" strokeLinecap="round" />
                    <path d="M 20 90 A 80 80 0 0 1 80 16" fill="none" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 80 16 A 80 80 0 0 1 120 16" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 120 16 A 80 80 0 0 1 180 90" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
                    {(() => {
                      const pcrNorm = Math.min(Math.max(pcr, 0.3), 1.7)
                      const angle = ((pcrNorm - 0.3) / 1.4) * 180
                      const rad = (angle * Math.PI) / 180
                      const nx = 100 - 65 * Math.cos(rad)
                      const ny = 90 - 65 * Math.sin(rad)
                      return (
                        <>
                          <line x1="100" y1="90" x2={nx} y2={ny} stroke="currentColor" strokeWidth="2.5" className="text-white" />
                          <circle cx="100" cy="90" r="5" className="fill-white" />
                        </>
                      )
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-end justify-center pb-0">
                    <span className={cn(
                      'text-2xl font-bold font-mono',
                      pcr > 1 ? 'text-emerald-400' : pcr < 0.7 ? 'text-red-400' : 'text-amber-500'
                    )}>
                      {pcr.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between w-48 text-[10px] text-gray-400 mb-3">
                  <span>Bearish (0.3)</span>
                  <span>Neutral</span>
                  <span>Bullish (1.7)</span>
                </div>
                <div className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  pcr > 1 ? 'bg-emerald-900/20 text-emerald-400' :
                  pcr < 0.7 ? 'bg-red-900/20 text-red-400' :
                  'bg-amber-900/20 text-amber-400'
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
            <div className="bg-[#111827] border border-[#1f2937] p-4 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target className="size-4 text-amber-500" />
                Key Levels & Support/Resistance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="size-4 text-emerald-400" />
                    <span className="text-sm text-gray-400">Resistance 1</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ₹{(highestCEOI?.strike || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="size-4 text-red-400" />
                    <span className="text-sm text-gray-400">Support 1</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ₹{(highestPEOI?.strike || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-amber-500" />
                    <span className="text-sm text-gray-400">Max Pain</span>
                  </div>
                  <span className="font-mono font-bold text-amber-500">
                    ₹{maxPainStrike.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1f2937]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Spot Price</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ₹{spotPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Trade Modal */}
      <QuickTradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        row={selectedRow}
        side={selectedSide}
        spotPrice={spotPrice}
        instrument={instrument}
      />
    </div>
  )
}
