'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, BarChart3, Shield, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { setAuth } = useAuthStore()

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setShowPassword(false)
  }

  const switchMode = (newMode: AuthMode) => {
    resetForm()
    setMode(newMode)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      setAuth(data.user, data.token)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setAuth(data.user, data.token)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (pwd: string): { level: number; color: string; label: string } => {
    if (pwd.length === 0) return { level: 0, color: '', label: '' }
    if (pwd.length < 4) return { level: 1, color: 'bg-red-500', label: 'Weak' }
    if (pwd.length < 6) return { level: 2, color: 'bg-red-500', label: 'Fair' }
    if (pwd.length < 8) return { level: 3, color: 'bg-amber-500', label: 'Good' }
    if (pwd.length < 10) return { level: 4, color: 'bg-emerald-500', label: 'Strong' }
    return { level: 4, color: 'bg-emerald-500', label: 'Very Strong' }
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Live Market Data',
      desc: 'NIFTY, BANKNIFTY, SENSEX & more with real-time option chain',
    },
    {
      icon: Shield,
      title: 'Zero Risk Practice',
      desc: 'Trade with ₹1,00,000 virtual money — learn without losing',
    },
    {
      icon: Zap,
      title: 'F&O Trading',
      desc: 'Practice futures & options with Indian market lot sizes',
    },
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0e17' }}>
      {/* Left Panel - Branding & Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #0a0e17 50%, #111827 100%)',
            }}
          />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Amber glow effects */}
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.07]"
            style={{
              background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
            }}
          />
          {/* Floating decorative elements */}
          <motion.div
            className="absolute top-24 right-24 w-72 h-72 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(40px)' }}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-32 left-16 w-56 h-56 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)', filter: 'blur(30px)' }}
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Small floating amber dots */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-amber-500/30"
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-amber-400/40"
            animate={{ y: [0, 10, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-amber-500/20"
            animate={{ y: [0, -12, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Candlestick chart decorative lines */}
          <svg className="absolute bottom-0 left-0 w-full h-48 opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <polyline
              points="0,140 50,120 100,130 150,90 200,100 250,60 300,80 350,50 400,70 450,40 500,55 550,30 600,45 650,25 700,35 750,20 800,30"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            {[100, 200, 300, 400, 500, 600, 700].map((x, i) => (
              <line
                key={i}
                x1={x}
                y1={140 - i * 15}
                x2={x}
                y2={110 - i * 15}
                stroke="#10b981"
                strokeWidth="4"
                opacity="0.6"
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-500/30">
              <TrendingUp className="size-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">StockVerse</h1>
              <p className="text-amber-400/80 text-sm">Indian Market Platform</p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Master Indian Markets<br />
              <span className="text-amber-400">Before You Invest</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Practice trading with real market data. Build strategies, analyze options, and sharpen your skills — all risk-free.
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 backdrop-blur-sm border border-amber-500/20">
                  <feature.icon className="size-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            className="mt-12 grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div
              className="text-center p-4 rounded-lg border border-amber-500/10"
              style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}
            >
              <div className="text-2xl font-bold text-amber-400">50+</div>
              <div className="text-gray-500 text-xs">NSE Stocks</div>
            </div>
            <div
              className="text-center p-4 rounded-lg border border-amber-500/10"
              style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}
            >
              <div className="text-2xl font-bold text-amber-400">5</div>
              <div className="text-gray-500 text-xs">Indices</div>
            </div>
            <div
              className="text-center p-4 rounded-lg border border-amber-500/10"
              style={{ backgroundColor: 'rgba(17,24,39,0.5)' }}
            >
              <div className="text-2xl font-bold text-amber-400">₹1L</div>
              <div className="text-gray-500 text-xs">Virtual Cash</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500 text-black">
              <TrendingUp className="size-5" />
            </div>
            <span className="text-xl font-bold text-white">StockVerse</span>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Login Card */}
                <div
                  className="p-8 rounded-2xl border"
                  style={{ backgroundColor: '#111827', borderColor: '#1f2937' }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                    <p className="text-gray-400 mt-1">
                      Sign in to continue your trading journey
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-300 text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 text-white placeholder:text-gray-600 border-[#1f2937] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                          style={{ backgroundColor: '#0a0e17', borderColor: '#1f2937' }}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-gray-300 text-sm font-medium">
                          Password
                        </Label>
                        <button
                          type="button"
                          className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 text-white placeholder:text-gray-600 border-[#1f2937] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                          style={{ backgroundColor: '#0a0e17', borderColor: '#1f2937' }}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border text-red-400 text-sm"
                        style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 text-base font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Sign In
                          <ArrowRight className="size-4" />
                        </div>
                      )}
                    </button>
                  </form>

                  {/* Switch to Signup */}
                  <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                      Don&apos;t have an account?{' '}
                      <button
                        onClick={() => switchMode('signup')}
                        className="text-amber-400 font-semibold hover:text-amber-300 hover:underline transition-colors"
                      >
                        Create Account
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Signup Card */}
                <div
                  className="p-8 rounded-2xl border"
                  style={{ backgroundColor: '#111827', borderColor: '#1f2937' }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white">Create Account</h2>
                    <p className="text-gray-400 mt-1">
                      Start trading with ₹1,00,000 virtual cash
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-gray-300 text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-11 text-white placeholder:text-gray-600 border-[#1f2937] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                          style={{ backgroundColor: '#0a0e17', borderColor: '#1f2937' }}
                          required
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-300 text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 text-white placeholder:text-gray-600 border-[#1f2937] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                          style={{ backgroundColor: '#0a0e17', borderColor: '#1f2937' }}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Phone (optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-gray-300 text-sm font-medium">
                        Phone Number <span className="text-gray-500 font-normal">(optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-11 text-white placeholder:text-gray-600 border-[#1f2937] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                          style={{ backgroundColor: '#0a0e17', borderColor: '#1f2937' }}
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-300 text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 text-white placeholder:text-gray-600 border-[#1f2937] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                          style={{ backgroundColor: '#0a0e17', borderColor: '#1f2937' }}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {/* Password strength indicator */}
                      {password && (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => {
                              const strength = getPasswordStrength(password)
                              return (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full transition-colors ${
                                    level <= strength.level ? strength.color : 'bg-gray-700'
                                  }`}
                                />
                              )
                            })}
                          </div>
                          <p
                            className={`text-xs mt-1.5 ${
                              getPasswordStrength(password).level >= 3
                                ? 'text-emerald-400'
                                : getPasswordStrength(password).level >= 2
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {getPasswordStrength(password).label}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-gray-300 text-sm font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                        <Input
                          id="signup-confirm"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`pl-10 h-11 text-white placeholder:text-gray-600 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 ${
                            confirmPassword && confirmPassword !== password
                              ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                              : 'border-[#1f2937]'
                          }`}
                          style={{ backgroundColor: '#0a0e17' }}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                      )}
                      {confirmPassword && confirmPassword === password && confirmPassword.length > 0 && (
                        <p className="text-emerald-400 text-xs mt-1">Passwords match</p>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-0.5 size-4 rounded border-gray-600 accent-amber-500"
                        style={{ backgroundColor: '#0a0e17' }}
                      />
                      <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
                        I agree to the{' '}
                        <span className="text-amber-400 hover:underline cursor-pointer">Terms of Service</span>{' '}
                        and{' '}
                        <span className="text-amber-400 hover:underline cursor-pointer">Privacy Policy</span>
                      </label>
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border text-red-400 text-sm"
                        style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Success */}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border text-emerald-400 text-sm"
                        style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}
                      >
                        {success}
                      </motion.div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || (confirmPassword !== '' && confirmPassword !== password)}
                      className="w-full h-11 text-base font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Creating Account...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Create Account
                          <ArrowRight className="size-4" />
                        </div>
                      )}
                    </button>
                  </form>

                  {/* Switch to Login */}
                  <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                      Already have an account?{' '}
                      <button
                        onClick={() => switchMode('login')}
                        className="text-amber-400 font-semibold hover:text-amber-300 hover:underline transition-colors"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom info */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span>🔒 Secure</span>
              <span>•</span>
              <span>🇮🇳 Made in India</span>
              <span>•</span>
              <span>₹0 Cost</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
