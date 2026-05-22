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
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Shield,
  Crown,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Download,
  LogOut,
  Lock,
  MonitorSmartphone,
  KeyRound,
  HelpCircle,
  MessageSquare,
  Ticket,
  Plus,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  FileText,
  RotateCcw,
  Zap,
  Bell,
  Settings,
  Trophy,
  IndianRupee,
  Phone,
  Check,
  X,
  Loader2,
} from 'lucide-react'

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
  bestTradePnl?: number
}

interface AppSettings {
  confirmBeforeTrade: boolean
  defaultOrderType: 'MARKET' | 'LIMIT'
  notifications: boolean
}

// ─── Color Constants (LIGHT Groww-style) ─────────────────────────

const C = {
  bg: '#f7f8fc',
  card: '#ffffff',
  cardAlt: '#f0f2f5',
  border: '#e8eaf0',
  green: '#00D09C',
  greenLight: '#e6faf4',
  red: '#eb5b3c',
  redLight: '#fef2ef',
  primary: '#1a1a1a',
  secondary: '#374151',
  muted: '#6b7280',
  lightMuted: '#9ca3af',
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Animation Variants ──────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

// ─── Plan Features ───────────────────────────────────────────────

const FREE_FEATURES = [
  'Virtual balance of ₹1,00,000',
  'Paper trading on NSE/BSE stocks',
  'Basic portfolio analytics',
  'Up to 50 trades per month',
]

const PREMIUM_FEATURES = [
  'Virtual balance of ₹10,00,000',
  'Unlimited paper trades',
  'Advanced analytics & reports',
  'Options & futures trading',
  'Priority support',
  'Custom watchlists',
]

// ─── Component ───────────────────────────────────────────────────

export function ProfilePage() {
  const { user, token, logout, setUser } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)

  // ─── Dialog States ───────────────────────────────────────
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [addMoneyOpen, setAddMoneyOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [raiseTicketOpen, setRaiseTicketOpen] = useState(false)

  // ─── Form States ─────────────────────────────────────────
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editProfileSubmitting, setEditProfileSubmitting] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false)

  const [addMoneyAmount, setAddMoneyAmount] = useState('')
  const [addMoneySubmitting, setAddMoneySubmitting] = useState(false)

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)

  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketSubmitting, setTicketSubmitting] = useState(false)

  // ─── Settings State ──────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>({
    confirmBeforeTrade: true,
    defaultOrderType: 'MARKET',
    notifications: true,
  })

  // ─── Sync edit form when dialog opens ────────────────────
  useEffect(() => {
    if (editProfileOpen) {
      setEditName(user?.name ?? '')
      setEditPhone(user?.phone ?? '')
    }
  }, [editProfileOpen, user?.name, user?.phone])

  // ─── Reset form fields when dialogs close ────────────────
  useEffect(() => {
    if (!changePasswordOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [changePasswordOpen])

  useEffect(() => {
    if (!addMoneyOpen) {
      setAddMoneyAmount('')
    }
  }, [addMoneyOpen])

  useEffect(() => {
    if (!withdrawOpen) {
      setWithdrawAmount('')
    }
  }, [withdrawOpen])

  useEffect(() => {
    if (!raiseTicketOpen) {
      setTicketSubject('')
      setTicketMessage('')
    }
  }, [raiseTicketOpen])

  // ─── Load settings from localStorage ─────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradepro_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // silent
    }
  }, [])

  // ─── Save settings to localStorage ───────────────────────
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem('tradepro_settings', JSON.stringify(newSettings))
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }, [])

  // ─── Fetch Portfolio ─────────────────────────────────────
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

  // ─── Derived values ──────────────────────────────────────
  const availableBalance = portfolio?.virtualBalance ?? user?.virtualBalance ?? 100000
  const usedCapital = portfolio?.marginUsed ?? user?.marginUsed ?? 0
  const totalPnl = portfolio?.totalPnl ?? user?.totalPnl ?? 0
  const isProfit = totalPnl >= 0
  const winRate = user?.winRate ?? 0
  const totalTrades = portfolio?.totalTrades ?? user?.totalTrades ?? 0
  const bestTradePnl = portfolio?.bestTradePnl ?? 0
  const showLowBalanceWarning = availableBalance < 10000
  const isOAuthUser = user?.oauthProvider === 'google'

  // ─── API Handlers ────────────────────────────────────────

  const handleEditProfile = async () => {
    if (!token) {
      toast.error('Please login to update profile')
      return
    }
    if (!editName.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setEditProfileSubmitting(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }
      setUser(data.user)
      toast.success('Profile updated successfully')
      setEditProfileOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setEditProfileSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!token) {
      toast.error('Please login to change password')
      return
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChangePasswordSubmitting(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password')
      }
      toast.success(data.message || 'Password changed successfully')
      setChangePasswordOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      toast.error(message)
    } finally {
      setChangePasswordSubmitting(false)
    }
  }

  const handleAddMoney = async () => {
    if (!token) {
      toast.error('Please login')
      return
    }
    const amount = parseFloat(addMoneyAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (amount > 10000000) {
      toast.error('Maximum ₹1,00,00,000 per transaction')
      return
    }
    setAddMoneySubmitting(true)
    try {
      const res = await fetch('/api/profile/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'add', amount }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add money')
      }
      if (user) {
        setUser({ ...user, virtualBalance: data.newBalance })
      }
      toast.success(data.message || `₹${amount.toLocaleString('en-IN')} added to wallet`)
      setAddMoneyOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add money'
      toast.error(message)
    } finally {
      setAddMoneySubmitting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!token) {
      toast.error('Please login')
      return
    }
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (amount > availableBalance) {
      toast.error('Insufficient balance')
      return
    }
    setWithdrawSubmitting(true)
    try {
      const res = await fetch('/api/profile/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'withdraw', amount }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to withdraw')
      }
      if (user) {
        setUser({ ...user, virtualBalance: data.newBalance })
      }
      toast.success(data.message || `₹${amount.toLocaleString('en-IN')} withdrawn from wallet`)
      setWithdrawOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to withdraw'
      toast.error(message)
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  const handleLogoutAll = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/profile/logout-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed')
      }
      toast.success(`Logged out from ${data.sessionsTerminated} device(s)`)
    } catch {
      toast.error('Failed to logout from all devices')
    }
  }

  const handleResetBalance = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/profile/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'add', amount: 100000 - availableBalance }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed')
      }
      if (user) {
        setUser({ ...user, virtualBalance: 100000, marginUsed: 0 })
      }
      toast.success('Virtual balance reset to ₹1,00,000')
    } catch {
      toast.error('Failed to reset balance')
    }
  }

  const handleRaiseTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setTicketSubmitting(true)
    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Ticket submitted successfully! We will get back to you soon.')
      setRaiseTicketOpen(false)
    } catch {
      toast.error('Failed to submit ticket')
    } finally {
      setTicketSubmitting(false)
    }
  }

  // ─── PDF Report Download ─────────────────────────────────
  const handleDownloadReport = async (type: 'last' | 'monthly' | 'full') => {
    if (!token) {
      toast.error('Please login to download reports')
      return
    }
    setDownloadingReport(type)
    try {
      const res = await fetch(`/api/profile/report?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Failed to download report')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filenameMap: Record<string, string> = {
        last: 'last-trade-report.pdf',
        monthly: 'monthly-report.pdf',
        full: 'full-trading-report.pdf',
      }
      a.download = filenameMap[type]
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch {
      toast.error('Failed to download report. Please try again.')
    } finally {
      setDownloadingReport(null)
    }
  }

  // ─── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  // ─── Loading State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-5" style={{ background: C.bg }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-80 rounded-2xl" style={{ background: C.card }} />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-36 rounded-2xl" style={{ background: C.card }} />
            <Skeleton className="h-32 rounded-2xl" style={{ background: C.card }} />
            <Skeleton className="h-48 rounded-2xl" style={{ background: C.card }} />
            <Skeleton className="h-40 rounded-2xl" style={{ background: C.card }} />
          </div>
        </div>
      </div>
    )
  }

  // ─── Section Index Counter ───────────────────────────────
  let sectionIndex = 0

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-5" style={{ background: C.bg }}>
      {/* ── Low Balance Warning Banner ──────────────────────────── */}
      {showLowBalanceWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{
            background: C.redLight,
            borderColor: 'rgba(235, 91, 60, 0.2)',
          }}
        >
          <AlertTriangle className="size-5 shrink-0" style={{ color: C.red }} />
          <p className="text-sm font-medium" style={{ color: C.red }}>
            Low Balance Warning: Your virtual balance is below ₹10,000
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: Profile Header (Sticky)
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* ── 1. PROFILE HEADER CARD ─────────────────────────── */}
            <motion.div
              custom={sectionIndex++}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card
                className="rounded-2xl border shadow-sm overflow-hidden"
                style={{ background: C.card, borderColor: C.border }}
              >
                <CardContent className="p-6">
                  {/* Top Section: Avatar + Info */}
                  <div className="flex flex-col items-center text-center mb-5">
                    <div
                      className="size-20 rounded-full flex items-center justify-center mb-4"
                      style={{ background: C.green }}
                    >
                      <span className="text-2xl font-bold text-white">
                        {getInitials(user?.name)}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold" style={{ color: C.primary }}>
                      {user?.name ?? 'User'}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: C.muted }}>
                      {user?.email ?? '—'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                        style={{
                          background: C.cardAlt,
                          color: C.lightMuted,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        ID: {user?.id?.slice(0, 8) ?? '--------'}
                      </span>
                    </div>
                  </div>

                  {/* Wallet Balance & Plan */}
                  <div
                    className="rounded-xl p-4 mb-5"
                    style={{
                      background: C.greenLight,
                      border: `1px solid rgba(0, 208, 156, 0.15)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: C.muted }}
                        >
                          Wallet Balance
                        </p>
                        <p className="text-2xl font-bold mt-1" style={{ color: C.green }}>
                          {formatINRWhole(availableBalance)}
                        </p>
                      </div>
                      <Badge
                        className="border-0 text-[10px] font-bold px-2.5 py-1"
                        style={{
                          background:
                            user?.subscription === 'PREMIUM'
                              ? C.greenLight
                              : C.cardAlt,
                          color: user?.subscription === 'PREMIUM' ? C.green : C.muted,
                        }}
                      >
                        <Crown className="size-3 mr-1" />
                        {user?.subscription ?? 'FREE'}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2 text-sm font-semibold h-10 border-0"
                      style={{ background: C.green, color: '#fff' }}
                      onClick={() => setEditProfileOpen(true)}
                    >
                      <User className="size-4" />
                      Edit Profile
                    </Button>
                    {isOAuthUser ? (
                      <Button
                        className="flex-1 gap-2 text-sm font-semibold h-10 cursor-not-allowed opacity-70"
                        style={{
                          background: C.cardAlt,
                          color: C.lightMuted,
                          border: `1px solid ${C.border}`,
                        }}
                        disabled
                      >
                        <MonitorSmartphone className="size-4" />
                        Google Account
                      </Button>
                    ) : (
                      <Button
                        className="flex-1 gap-2 text-sm font-semibold h-10"
                        style={{
                          background: 'transparent',
                          color: C.secondary,
                          border: `1px solid ${C.border}`,
                        }}
                        onClick={() => setChangePasswordOpen(true)}
                      >
                        <KeyRound className="size-4" />
                        Change Password
                      </Button>
                    )}
                  </div>

                  {/* Contact Details */}
                  <Separator className="my-5" style={{ background: C.border }} />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: C.cardAlt }}
                      >
                        <Mail className="size-4" style={{ color: C.muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.lightMuted }}>
                          Email
                        </p>
                        <p className="text-sm font-medium truncate" style={{ color: C.primary }}>
                          {user?.email ?? '—'}
                        </p>
                      </div>
                      {user?.isEmailVerified && (
                        <Badge
                          className="border-0 text-[10px] font-semibold px-1.5 py-0"
                          style={{ background: C.greenLight, color: C.green }}
                        >
                          <Check className="size-3 mr-0.5" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: C.cardAlt }}
                      >
                        <Phone className="size-4" style={{ color: C.muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.lightMuted }}>
                          Phone
                        </p>
                        <p className="text-sm font-medium" style={{ color: C.primary }}>
                          {user?.phone ?? 'Not added'}
                        </p>
                      </div>
                      {user?.isPhoneVerified && user?.phone && (
                        <Badge
                          className="border-0 text-[10px] font-semibold px-1.5 py-0"
                          style={{ background: C.greenLight, color: C.green }}
                        >
                          <Check className="size-3 mr-0.5" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: C.cardAlt }}
                      >
                        <Shield className="size-4" style={{ color: C.muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.lightMuted }}>
                          Role
                        </p>
                        <p className="text-sm font-medium" style={{ color: C.primary }}>
                          {user?.role ?? 'USER'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" style={{ background: C.border }} />

                  {/* Last Login & Member Since */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.muted }}>
                      Last Login
                    </span>
                    <span className="text-xs font-medium" style={{ color: C.secondary }}>
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
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: C.muted }}>
                      Member Since
                    </span>
                    <span className="text-xs font-medium" style={{ color: C.secondary }}>
                      {formatDate(user?.createdAt ?? null)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: All Other Sections
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">
          {/* ── 2. WALLET SECTION ────────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Available Balance */}
              <Card
                className="rounded-2xl border shadow-sm"
                style={{ background: C.card, borderColor: C.border }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <Wallet className="size-4" style={{ color: C.green }} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
                      Available Balance
                    </span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: C.green }}>
                    {formatINRWhole(availableBalance)}
                  </p>
                </CardContent>
              </Card>

              {/* Used Capital */}
              <Card
                className="rounded-2xl border shadow-sm"
                style={{ background: C.card, borderColor: C.border }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.cardAlt }}
                    >
                      <IndianRupee className="size-4" style={{ color: C.muted }} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
                      Used Capital
                    </span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: C.secondary }}>
                    {formatINRWhole(usedCapital)}
                  </p>
                </CardContent>
              </Card>

              {/* Total P&L */}
              <Card
                className="rounded-2xl border shadow-sm"
                style={{
                  background: C.card,
                  borderColor: isProfit ? 'rgba(0,208,156,0.25)' : 'rgba(235,91,60,0.25)',
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: isProfit ? C.greenLight : C.redLight,
                      }}
                    >
                      {isProfit ? (
                        <TrendingUp className="size-4" style={{ color: C.green }} />
                      ) : (
                        <TrendingDown className="size-4" style={{ color: C.red }} />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
                      Total P&L
                    </span>
                  </div>
                  <p
                    className="text-xl font-bold"
                    style={{ color: isProfit ? C.green : C.red }}
                  >
                    {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Actions */}
            <div className="flex gap-3 mt-4">
              <Button
                className="gap-2 text-sm font-semibold h-10 border-0"
                style={{ background: C.green, color: '#fff' }}
                onClick={() => setAddMoneyOpen(true)}
              >
                <Plus className="size-4" />
                Add Money
              </Button>
              <Button
                className="gap-2 text-sm font-semibold h-10"
                style={{
                  background: 'transparent',
                  color: C.secondary,
                  border: `1px solid ${C.border}`,
                }}
                onClick={() => setWithdrawOpen(true)}
              >
                <ArrowUpRight className="size-4" />
                Withdraw
              </Button>
            </div>
          </motion.div>

          {/* ── 3. SUBSCRIPTION SECTION ──────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.primary }}>
                    Subscription
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: C.muted }}>Current Plan:</span>
                      <Badge
                        className="border-0 text-xs font-bold px-3 py-1"
                        style={{
                          background:
                            user?.subscription === 'PREMIUM'
                              ? C.greenLight
                              : C.cardAlt,
                          color: user?.subscription === 'PREMIUM' ? C.green : C.muted,
                        }}
                      >
                        <Crown className="size-3 mr-1" />
                        {user?.subscription ?? 'FREE'}
                      </Badge>
                    </div>

                    {/* Plan Features */}
                    <div className="mt-3 space-y-2">
                      {(user?.subscription === 'PREMIUM' ? PREMIUM_FEATURES : FREE_FEATURES).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="size-3.5 shrink-0" style={{ color: C.green }} />
                          <span className="text-sm" style={{ color: C.secondary }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button
                      className="gap-2 text-sm font-semibold h-10 px-5 border-0"
                      style={{ background: C.green, color: '#fff' }}
                      onClick={() =>
                        toast.info('Premium Features', {
                          description: 'Unlock unlimited trades, advanced analytics, options trading & more with Premium!',
                        })
                      }
                    >
                      <Zap className="size-4" />
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 4. SETTINGS SECTION ──────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.primary }}>
                    Settings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Confirm before trade */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <Shield className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Confirm before trade
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        Show confirmation dialog before placing orders
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.confirmBeforeTrade}
                    onCheckedChange={(checked) =>
                      saveSettings({ ...settings, confirmBeforeTrade: checked })
                    }
                    className="data-[state=checked]:bg-[#00D09C]"
                  />
                </div>

                <Separator style={{ background: C.border }} />

                {/* Default order type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <BarChart3 className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Default order type
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        Choose your preferred order type
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      style={{
                        background:
                          settings.defaultOrderType === 'MARKET'
                            ? C.green
                            : C.cardAlt,
                        color: settings.defaultOrderType === 'MARKET' ? '#fff' : C.muted,
                        border:
                          settings.defaultOrderType === 'MARKET'
                            ? '1px solid transparent'
                            : `1px solid ${C.border}`,
                      }}
                      onClick={() =>
                        saveSettings({ ...settings, defaultOrderType: 'MARKET' })
                      }
                    >
                      Market
                    </button>
                    <button
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      style={{
                        background:
                          settings.defaultOrderType === 'LIMIT'
                            ? C.green
                            : C.cardAlt,
                        color: settings.defaultOrderType === 'LIMIT' ? '#fff' : C.muted,
                        border:
                          settings.defaultOrderType === 'LIMIT'
                            ? '1px solid transparent'
                            : `1px solid ${C.border}`,
                      }}
                      onClick={() =>
                        saveSettings({ ...settings, defaultOrderType: 'LIMIT' })
                      }
                    >
                      Limit
                    </button>
                  </div>
                </div>

                <Separator style={{ background: C.border }} />

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <Bell className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Notifications
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        Receive trade alerts and updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) =>
                      saveSettings({ ...settings, notifications: checked })
                    }
                    className="data-[state=checked]:bg-[#00D09C]"
                  />
                </div>

                <Separator style={{ background: C.border }} />

                {/* Reset Virtual Balance */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.redLight }}
                    >
                      <RotateCcw className="size-4" style={{ color: C.red }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Reset virtual balance
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        Reset balance to ₹1,00,000 (default)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold h-8"
                    style={{ borderColor: C.border, color: C.red }}
                    onClick={handleResetBalance}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 5. PERFORMANCE SUMMARY ───────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5" style={{ color: C.green }} />
                    <CardTitle className="text-base font-semibold" style={{ color: C.primary }}>
                      Performance Summary
                    </CardTitle>
                  </div>
                  <Badge
                    className="border-0 text-[10px] font-bold"
                    style={{
                      background: C.greenLight,
                      color: C.green,
                    }}
                  >
                    {totalTrades} Trade{totalTrades !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3"
                >
                  {/* Total Trades */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: C.greenLight,
                      border: '1px solid rgba(0, 208, 156, 0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="size-4" style={{ color: C.green }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Total Trades
                      </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: C.green }}>
                      {totalTrades}
                    </p>
                  </motion.div>

                  {/* Win Rate */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: winRate >= 50 ? C.greenLight : C.redLight,
                      border: winRate >= 50 ? '1px solid rgba(0, 208, 156, 0.12)' : '1px solid rgba(235, 91, 60, 0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="size-4" style={{ color: winRate >= 50 ? C.green : C.red }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Win Rate
                      </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: winRate >= 50 ? C.green : C.red }}>
                      {winRate.toFixed(1)}%
                    </p>
                  </motion.div>

                  {/* Total P&L */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: isProfit ? C.greenLight : C.redLight,
                      border: isProfit ? '1px solid rgba(0, 208, 156, 0.12)' : '1px solid rgba(235, 91, 60, 0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isProfit ? (
                        <TrendingUp className="size-4" style={{ color: C.green }} />
                      ) : (
                        <TrendingDown className="size-4" style={{ color: C.red }} />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Total P&L
                      </span>
                    </div>
                    <p className="text-xl font-bold" style={{ color: isProfit ? C.green : C.red }}>
                      {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                    </p>
                  </motion.div>

                  {/* Best Trade */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: bestTradePnl >= 0 ? C.greenLight : C.redLight,
                      border: bestTradePnl >= 0 ? '1px solid rgba(0, 208, 156, 0.12)' : '1px solid rgba(235, 91, 60, 0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="size-4" style={{ color: bestTradePnl >= 0 ? C.green : C.red }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Best Trade
                      </span>
                    </div>
                    <p className="text-xl font-bold" style={{ color: bestTradePnl >= 0 ? C.green : C.red }}>
                      {bestTradePnl >= 0 ? '+' : '-'}{formatINR(Math.abs(bestTradePnl))}
                    </p>
                  </motion.div>
                </motion.div>

                <div className="mt-4">
                  <Button
                    className="w-full gap-2 text-sm font-semibold h-10"
                    style={{ background: C.greenLight, color: C.green, border: `1px solid rgba(0, 208, 156, 0.2)` }}
                    onClick={() => setCurrentPage('reports')}
                  >
                    <BarChart3 className="size-4" />
                    View Full Report
                    <ChevronRight className="size-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 6. PDF REPORT DOWNLOAD ───────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.primary }}>
                    Download Reports
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Last Trade Report */}
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:shadow-md"
                    style={{
                      background: C.cardAlt,
                      border: `1px solid ${C.border}`,
                    }}
                    onClick={() => handleDownloadReport('last')}
                    disabled={downloadingReport !== null}
                  >
                    <div
                      className="size-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: C.greenLight }}
                    >
                      {downloadingReport === 'last' ? (
                        <Loader2 className="size-5 animate-spin" style={{ color: C.green }} />
                      ) : (
                        <Download className="size-5" style={{ color: C.green }} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: C.primary }}>Last Trade</p>
                      <p className="text-[11px]" style={{ color: C.lightMuted }}>Most recent trade</p>
                    </div>
                  </button>

                  {/* Monthly Report */}
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:shadow-md"
                    style={{
                      background: C.cardAlt,
                      border: `1px solid ${C.border}`,
                    }}
                    onClick={() => handleDownloadReport('monthly')}
                    disabled={downloadingReport !== null}
                  >
                    <div
                      className="size-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: C.greenLight }}
                    >
                      {downloadingReport === 'monthly' ? (
                        <Loader2 className="size-5 animate-spin" style={{ color: C.green }} />
                      ) : (
                        <Download className="size-5" style={{ color: C.green }} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: C.primary }}>Monthly</p>
                      <p className="text-[11px]" style={{ color: C.lightMuted }}>This month&apos;s summary</p>
                    </div>
                  </button>

                  {/* Full Report */}
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:shadow-md"
                    style={{
                      background: C.cardAlt,
                      border: `1px solid ${C.border}`,
                    }}
                    onClick={() => handleDownloadReport('full')}
                    disabled={downloadingReport !== null}
                  >
                    <div
                      className="size-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: C.greenLight }}
                    >
                      {downloadingReport === 'full' ? (
                        <Loader2 className="size-5 animate-spin" style={{ color: C.green }} />
                      ) : (
                        <Download className="size-5" style={{ color: C.green }} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: C.primary }}>Full Report</p>
                      <p className="text-[11px]" style={{ color: C.lightMuted }}>Complete trading history</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 7. SECURITY SECTION ──────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.primary }}>
                    Security
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Change Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <KeyRound className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Change Password
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        {isOAuthUser ? 'Managed via Google' : 'Update your account password'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold h-8"
                    style={{ borderColor: C.border, color: isOAuthUser ? C.lightMuted : C.green }}
                    disabled={isOAuthUser}
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Change
                  </Button>
                </div>

                <Separator style={{ background: C.border }} />

                {/* Logout from all devices */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.redLight }}
                    >
                      <MonitorSmartphone className="size-4" style={{ color: C.red }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Logout from all devices
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        Terminate all active sessions
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold h-8"
                    style={{ borderColor: C.border, color: C.red }}
                    onClick={handleLogoutAll}
                  >
                    Logout All
                  </Button>
                </div>

                <Separator style={{ background: C.border }} />

                {/* Enable 2FA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.cardAlt }}
                    >
                      <Shield className="size-4" style={{ color: C.lightMuted }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>
                        Enable 2FA
                      </p>
                      <p className="text-xs" style={{ color: C.lightMuted }}>
                        Two-factor authentication
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold h-8 opacity-60 cursor-not-allowed"
                    style={{ borderColor: C.border, color: C.lightMuted }}
                    disabled
                  >
                    Coming soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 8. HELP & SUPPORT ────────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.primary }}>
                    Help & Support
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* FAQ */}
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:shadow-sm"
                  style={{ background: C.cardAlt, border: `1px solid ${C.border}` }}
                  onClick={() => setCurrentPage('faq')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <HelpCircle className="size-4" style={{ color: C.green }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: C.primary }}>FAQ</p>
                      <p className="text-[11px]" style={{ color: C.lightMuted }}>Frequently asked questions</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.lightMuted }} />
                </button>

                {/* Contact Support */}
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:shadow-sm"
                  style={{ background: C.cardAlt, border: `1px solid ${C.border}` }}
                  onClick={() => setCurrentPage('contact-us')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <MessageSquare className="size-4" style={{ color: C.green }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: C.primary }}>Contact Support</p>
                      <p className="text-[11px]" style={{ color: C.lightMuted }}>Get in touch with our team</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.lightMuted }} />
                </button>

                {/* Raise Ticket */}
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:shadow-sm"
                  style={{ background: C.cardAlt, border: `1px solid ${C.border}` }}
                  onClick={() => setRaiseTicketOpen(true)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ background: C.greenLight }}
                    >
                      <Ticket className="size-4" style={{ color: C.green }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: C.primary }}>Raise a Ticket</p>
                      <p className="text-[11px]" style={{ color: C.lightMuted }}>Report an issue or give feedback</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.lightMuted }} />
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 9. LOGOUT BUTTON ──────────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-2xl border shadow-sm"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardContent className="p-4">
                <Button
                  className="w-full gap-2 text-sm font-semibold h-11 border-0"
                  style={{ background: C.redLight, color: C.red }}
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DIALOGS
      ═══════════════════════════════════════════════════════════ */}

      {/* ── Edit Profile Dialog ──────────────────────────────── */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.primary }}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" style={{ color: C.secondary }}>Full Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter your full name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" style={{ color: C.secondary }}>Phone Number</Label>
              <Input
                id="edit-phone"
                placeholder="Enter your phone number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="text-sm"
                style={{ borderColor: C.border, color: C.secondary }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="text-sm border-0"
              style={{ background: C.green, color: '#fff' }}
              onClick={handleEditProfile}
              disabled={editProfileSubmitting}
            >
              {editProfileSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ───────────────────────────── */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.primary }}>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password" style={{ color: C.secondary }}>Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" style={{ color: C.secondary }}>New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" style={{ color: C.secondary }}>Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
              {confirmPassword && newPassword && confirmPassword !== newPassword && (
                <p className="text-xs mt-1" style={{ color: C.red }}>Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="text-sm"
                style={{ borderColor: C.border, color: C.secondary }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="text-sm border-0"
              style={{ background: C.green, color: '#fff' }}
              onClick={handleChangePassword}
              disabled={changePasswordSubmitting}
            >
              {changePasswordSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Money Dialog ─────────────────────────────────── */}
      <Dialog open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.primary }}>Add Virtual Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-amount" style={{ color: C.secondary }}>Amount (₹)</Label>
              <Input
                id="add-amount"
                type="number"
                placeholder="Enter amount to add"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                min="1"
                max="10000000"
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
              <p className="text-xs" style={{ color: C.lightMuted }}>
                Max ₹1,00,00,000 per transaction
              </p>
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-2 flex-wrap">
              {[10000, 50000, 100000, 500000].map((amt) => (
                <button
                  key={amt}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                  style={{
                    background: C.greenLight,
                    color: C.green,
                    border: '1px solid rgba(0, 208, 156, 0.2)',
                  }}
                  onClick={() => setAddMoneyAmount(String(amt))}
                >
                  +{formatINRWhole(amt)}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="text-sm"
                style={{ borderColor: C.border, color: C.secondary }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="text-sm border-0"
              style={{ background: C.green, color: '#fff' }}
              onClick={handleAddMoney}
              disabled={addMoneySubmitting}
            >
              {addMoneySubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-1" />
                  Add Money
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Withdraw Dialog ──────────────────────────────────── */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.primary }}>Withdraw Virtual Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount" style={{ color: C.secondary }}>Amount (₹)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={availableBalance}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
              <p className="text-xs" style={{ color: C.lightMuted }}>
                Available: {formatINRWhole(availableBalance)}
              </p>
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-2 flex-wrap">
              {[10000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40"
                  style={{
                    background: C.cardAlt,
                    color: C.secondary,
                    border: `1px solid ${C.border}`,
                  }}
                  onClick={() => setWithdrawAmount(String(Math.min(amt, availableBalance)))}
                  disabled={amt > availableBalance}
                >
                  {formatINRWhole(amt)}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="text-sm"
                style={{ borderColor: C.border, color: C.secondary }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="text-sm border-0"
              style={{ background: C.red, color: '#fff' }}
              onClick={handleWithdraw}
              disabled={withdrawSubmitting}
            >
              {withdrawSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4 mr-1" />
                  Withdraw
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Raise Ticket Dialog ──────────────────────────────── */}
      <Dialog open={raiseTicketOpen} onOpenChange={setRaiseTicketOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: C.primary }}>Raise a Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-subject" style={{ color: C.secondary }}>Subject</Label>
              <Input
                id="ticket-subject"
                placeholder="Brief description of your issue"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                style={{ background: C.cardAlt, borderColor: C.border, color: C.primary }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-message" style={{ color: C.secondary }}>Message</Label>
              <textarea
                id="ticket-message"
                placeholder="Describe your issue or feedback in detail"
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="flex w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00D09C]/30"
                style={{
                  background: C.cardAlt,
                  borderColor: C.border,
                  color: C.primary,
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="text-sm"
                style={{ borderColor: C.border, color: C.secondary }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="text-sm border-0"
              style={{ background: C.green, color: '#fff' }}
              onClick={handleRaiseTicket}
              disabled={ticketSubmitting}
            >
              {ticketSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Ticket className="size-4 mr-1" />
                  Submit Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
