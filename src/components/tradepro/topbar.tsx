'use client'

import { Menu, Search, Bell, LogOut, Wallet, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  userName?: string | null
  onLogout?: () => void
}

export function TopBar({ userName, onLogout }: TopBarProps) {
  const { setSidebarOpen, setCurrentPage } = useAppStore()
  const { user } = useAuthStore()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SV'

  const balance = user?.virtualBalance ?? 100000
  const totalPnl = user?.totalPnl ?? 0
  const isProfit = totalPnl >= 0

  return (
    <header
      className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center md:left-[260px]"
      role="banner"
    >
      <div
        className="flex h-full w-full items-center gap-3 px-3 md:px-5"
        style={{
          background: '#111827',
          borderBottom: '1px solid #1f2937',
        }}
      >
        {/* Left: Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-white/5"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Search - Desktop */}
        <div className="relative hidden flex-1 max-w-sm md:flex">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
          <Input
            type="search"
            placeholder="Search stocks, indices..."
            className="pl-9 h-9 text-sm border-none focus-visible:ring-1 focus-visible:ring-amber-500/30 placeholder:text-[#4b5563]"
            style={{
              background: '#0a0e17',
              color: '#f9fafb',
            }}
          />
        </div>

        {/* Search - Mobile */}
        <div className="relative flex-1 md:hidden">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#6b7280]" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 h-9 text-sm border-none focus-visible:ring-1 focus-visible:ring-amber-500/30 placeholder:text-[#4b5563]"
            style={{
              background: '#0a0e17',
              color: '#f9fafb',
            }}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Wallet Balance */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: '#0a0e17',
              border: '1px solid #1f2937',
            }}
          >
            <Wallet className="size-4 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium leading-tight" style={{ color: '#6b7280' }}>
                Balance
              </span>
              <span className="text-xs font-bold font-mono-data text-[#f9fafb] leading-tight">
                ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* P&L Badge */}
          {totalPnl !== 0 && (
            <div
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono-data"
              style={{
                background: isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isProfit ? '#10b981' : '#ef4444',
                border: `1px solid ${isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              }}
            >
              {isProfit ? '▲' : '▼'}
              <span>
                {isProfit ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-white/5"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
          </Button>

          {/* Divider */}
          <div className="mx-0.5 h-6 w-px hidden md:block" style={{ background: '#1f2937' }} />

          {/* User Menu (Dropdown) - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-white/5 outline-none">
                <Avatar className="size-7" style={{ border: '1px solid #1f2937' }}>
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium text-[#f9fafb] leading-tight">
                    {userName || 'User'}
                  </span>
                  <span className="text-[10px] leading-tight" style={{ color: '#6b7280' }}>
                    Paper Trading
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-[#6b7280]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                color: '#f9fafb',
              }}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium text-[#f9fafb]">{userName || 'User'}</span>
                  <span className="text-xs" style={{ color: '#6b7280' }}>Paper Trading Account</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: '#1f2937' }} />
              <DropdownMenuItem
                onClick={() => setCurrentPage('profile')}
                className="text-[#9ca3af] focus:text-[#f9fafb] focus:bg-white/5 cursor-pointer"
              >
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentPage('reports')}
                className="text-[#9ca3af] focus:text-[#f9fafb] focus:bg-white/5 cursor-pointer"
              >
                My Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: '#1f2937' }} />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="size-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile: Avatar only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden outline-none shrink-0">
                <Avatar className="size-7" style={{ border: '1px solid #1f2937' }}>
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                color: '#f9fafb',
              }}
            >
              <DropdownMenuLabel className="text-[#f9fafb]">{userName || 'User'}</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: '#1f2937' }} />
              <DropdownMenuItem
                onClick={() => setCurrentPage('profile')}
                className="text-[#9ca3af] focus:text-[#f9fafb] focus:bg-white/5 cursor-pointer"
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: '#1f2937' }} />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="size-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
