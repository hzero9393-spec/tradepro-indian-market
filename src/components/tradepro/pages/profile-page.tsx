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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  Crown,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  BarChart3,
  Landmark,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────

export function ProfilePage() {
  const { user, token } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── Fetch Portfolio ──────────────────────────────────────
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

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchPortfolio()
      setLoading(false)
    }
    load()
  }, [fetchPortfolio])

  // ─── Reset Account ────────────────────────────────────────
  const handleResetAccount = () => {
    toast.info('Feature coming soon', {
      description: 'Account reset will be available in a future update.',
    })
  }

  // ─── Derived values ───────────────────────────────────────
  const initialCapital = 100000
  const currentPortfolioValue = portfolio?.totalPortfolioValue ?? (user?.virtualBalance ?? initialCapital)
  const totalPnl = portfolio?.totalPnl ?? user?.totalPnl ?? 0
  const totalReturn = portfolio?.totalReturn ?? 0
  const isProfit = totalPnl >= 0

  // ─── Account Stats ────────────────────────────────────────
  const accountStats = [
    {
      label: 'Virtual Balance',
      value: formatINR(portfolio?.virtualBalance ?? user?.virtualBalance ?? initialCapital),
      icon: Wallet,
      borderColor: 'border-l-amber-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Total Trades',
      value: String(portfolio?.totalTrades ?? user?.totalTrades ?? 0),
      icon: BarChart3,
      borderColor: 'border-l-amber-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Total P&L',
      value: `${totalPnl >= 0 ? '+' : '-'}${formatINR(Math.abs(totalPnl))}`,
      icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
      borderColor: totalPnl >= 0 ? 'border-l-emerald-500' : 'border-l-red-500',
      textColor: totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Win Rate',
      value: `${(user?.winRate ?? 0).toFixed(1)}%`,
      icon: Target,
      borderColor: (user?.winRate ?? 0) >= 50 ? 'border-l-emerald-500' : 'border-l-red-500',
      textColor: (user?.winRate ?? 0) >= 50 ? 'text-emerald-500' : 'text-red-500',
      bgColor: (user?.winRate ?? 0) >= 50 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Margin Used',
      value: formatINR(portfolio?.marginUsed ?? user?.marginUsed ?? 0),
      icon: Landmark,
      borderColor: 'border-l-gray-500',
      textColor: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
    },
  ]

  // ─── Profile Info Items ───────────────────────────────────
  const profileItems = [
    {
      icon: Mail,
      label: 'Email',
      value: user?.email ?? '—',
      verified: user?.isEmailVerified ?? false,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: user?.phone ?? 'Not set',
      verified: user?.isPhoneVerified ?? false,
    },
    {
      icon: CreditCard,
      label: 'PAN Number',
      value: user?.panNumber ?? 'Not set',
      verified: !!user?.panNumber,
    },
    {
      icon: Shield,
      label: 'Role',
      value: user?.role ?? 'USER',
      verified: true,
    },
    {
      icon: Crown,
      label: 'Subscription',
      value: user?.subscription ?? 'FREE',
      verified: user?.subscription === 'PREMIUM',
    },
    {
      icon: CalendarDays,
      label: 'Member Since',
      value: formatDate(user?.createdAt ?? null),
      verified: true,
    },
  ]

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8 space-y-5">
        <div>
          <Skeleton className="h-8 w-36 mb-2 bg-[#1f2937]" />
          <Skeleton className="h-4 w-64 bg-[#1f2937]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-xl bg-[#1f2937]" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-xl bg-[#1f2937]" />
            <Skeleton className="h-60 rounded-xl bg-[#1f2937]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          My Account
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Manage your account, view stats, and track your trading journey.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: Profile Card ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="lg:row-span-2"
        >
          <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm h-full">
            <CardContent className="p-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="size-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 ring-2 ring-amber-500/30">
                  <span className="text-2xl font-bold text-amber-500">
                    {user?.name
                      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : '??'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{user?.name ?? 'User'}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{user?.email ?? '—'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`border-0 text-[10px] font-semibold ${
                    user?.subscription === 'PREMIUM'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    <Crown className="size-3 mr-0.5" />
                    {user?.subscription ?? 'FREE'}
                  </Badge>
                  <Badge className="border-0 text-[10px] font-semibold bg-amber-500/10 text-amber-500">
                    {user?.role ?? 'USER'}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-[#1f2937]/40 mb-4" />

              {/* Profile Details */}
              <div className="space-y-3">
                {profileItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-[#0d111c] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="size-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {item.label}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-sm font-medium text-white truncate">
                            {item.value}
                          </p>
                          {item.verified && item.label !== 'Member Since' && item.label !== 'Role' && (
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          )}
                          {!item.verified && (item.label === 'Phone' || item.label === 'PAN Number') && (
                            <AlertCircle className="size-3.5 text-gray-400/40 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator className="bg-[#1f2937]/40 my-4" />

              {/* Last Login */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Last Login</span>
                <span className="text-xs font-medium text-white">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right: Top Section - Account Balance ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Account Balance
                  </p>
                  <h3 className="font-mono-data text-2xl sm:text-3xl font-bold text-white mt-1">
                    {formatINRWhole(currentPortfolioValue)}
                    <span className="text-lg opacity-50">.{Math.abs(currentPortfolioValue % 1).toFixed(2).substring(2)}</span>
                  </h3>
                  <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isProfit ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {isProfit ? '+' : ''}{totalReturn.toFixed(2)}% overall return
                  </div>
                </div>
                <Button
                  className="gap-1.5 bg-amber-500 text-black font-semibold shadow-md hover:bg-amber-400 active:scale-[0.98]"
                  onClick={() => setCurrentPage('trading')}
                >
                  <TrendingUp className="size-4" />
                  New Trade
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Initial Capital */}
                <div className="rounded-xl bg-[#0d111c]/50 p-3 border border-[#1f2937]/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Initial Capital
                  </p>
                  <p className="font-mono-data text-base font-bold text-gray-400 mt-1">
                    ₹1,00,000
                  </p>
                </div>

                {/* Current Value */}
                <div className="rounded-xl bg-[#0d111c]/50 p-3 border border-[#1f2937]/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Current Value
                  </p>
                  <p className="font-mono-data text-base font-bold text-white mt-1">
                    {formatINRWhole(currentPortfolioValue)}
                  </p>
                </div>

                {/* Net P&L */}
                <div className={`rounded-xl p-3 border ${
                  isProfit
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Net P&L
                  </p>
                  <p className={`font-mono-data text-base font-bold mt-1 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                  </p>
                </div>

                {/* Realized P&L */}
                <div className="rounded-xl bg-[#0d111c]/50 p-3 border border-[#1f2937]/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Realized P&L
                  </p>
                  <p className={`font-mono-data text-base font-bold mt-1 ${
                    (portfolio?.totalRealizedPnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {(portfolio?.totalRealizedPnl ?? 0) >= 0 ? '+' : '-'}{formatINR(Math.abs(portfolio?.totalRealizedPnl ?? 0))}
                  </p>
                </div>

                {/* Unrealized P&L */}
                <div className="rounded-xl bg-[#0d111c]/50 p-3 border border-[#1f2937]/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Unrealized P&L
                  </p>
                  <p className={`font-mono-data text-base font-bold mt-1 ${
                    (portfolio?.totalUnrealizedPnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {(portfolio?.totalUnrealizedPnl ?? 0) >= 0 ? '+' : '-'}{formatINR(Math.abs(portfolio?.totalUnrealizedPnl ?? 0))}
                  </p>
                </div>

                {/* Available Margin */}
                <div className="rounded-xl bg-[#0d111c]/50 p-3 border border-[#1f2937]/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Available Margin
                  </p>
                  <p className="font-mono-data text-base font-bold text-white mt-1">
                    {formatINR(portfolio?.availableMargin ?? (user?.virtualBalance ?? initialCapital))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right: Bottom Section - Trading Stats ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl border border-[#1f2937]/60 bg-[#111827] shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white">
                  Trading Stats
                </CardTitle>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-0 text-xs font-semibold">
                  {portfolio?.openPositionsCount ?? 0} Open Position{(portfolio?.openPositionsCount ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {accountStats.map((stat, idx) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      className={`rounded-xl border border-[#1f2937]/40 bg-[#0d111c]/50 p-3 border-l-4 ${stat.borderColor} hover:bg-[#0d111c]/80 transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                          {stat.label}
                        </p>
                        <div className={`size-6 rounded-md ${stat.bgColor} flex items-center justify-center`}>
                          <Icon className={`size-3 ${stat.textColor}`} />
                        </div>
                      </div>
                      <p className={`font-mono-data text-sm font-bold ${stat.textColor}`}>
                        {stat.value}
                      </p>
                    </motion.div>
                  )
                })}
              </div>

              <Separator className="bg-[#1f2937]/40 my-5" />

              {/* Account Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-[#1f2937]/50 text-gray-400 hover:bg-[#0d111c] hover:text-white"
                  onClick={() => setCurrentPage('reports')}
                >
                  <BarChart3 className="size-4" />
                  View Reports
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-[#1f2937]/50 text-gray-400 hover:bg-[#0d111c] hover:text-white"
                  onClick={() => setCurrentPage('portfolio')}
                >
                  <Briefcase className="size-4" />
                  Portfolio
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={handleResetAccount}
                >
                  <RotateCcw className="size-4" />
                  Reset Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
