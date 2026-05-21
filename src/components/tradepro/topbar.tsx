'use client'

import { Menu, Search, Bell, LogOut, Wallet } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
    : 'TP'

  const balance = user?.virtualBalance ?? 100000
  const marginUsed = user?.marginUsed ?? 0
  const totalPnl = user?.totalPnl ?? 0

  return (
    <header
      className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center md:left-[260px]"
      role="banner"
    >
      <div className="glass-card flex h-full w-full items-center gap-3 px-3 shadow-sm md:px-5">
        {/* Left: Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Search */}
        <div className="relative hidden flex-1 max-w-sm md:flex">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stocks, indices..."
            className="pl-9 bg-tp-surface-container-lowest border-tp-outline-variant/50 h-8 text-sm"
          />
        </div>

        {/* Mobile: compact search */}
        <div className="relative flex-1 md:hidden">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 bg-tp-surface-container-lowest border-tp-outline-variant/50 h-8 text-sm"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Wallet Balance */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tp-surface-container-low border border-tp-outline-variant/20">
            <Wallet className="size-4 text-tp-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-tp-on-surface-variant leading-tight">
                Balance
              </span>
              <span className="text-xs font-bold font-mono-data text-tp-on-surface leading-tight">
                ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* P&L Badge */}
          {totalPnl !== 0 && (
            <Badge
              variant="secondary"
              className={`hidden md:flex text-[10px] font-semibold border-0 gap-0.5 px-2 py-1 ${
                totalPnl >= 0
                  ? 'bg-tp-secondary/10 text-tp-secondary'
                  : 'bg-tp-tertiary/10 text-tp-tertiary'
              }`}
            >
              {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Badge>
          )}

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0"
            aria-label="Notifications"
          >
            <Bell className="size-4.5 text-tp-on-surface-variant" />
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          </Button>

          {/* Divider */}
          <Separator orientation="vertical" className="mx-0.5 h-6 hidden md:block" />

          {/* User Menu (Dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-accent outline-none">
                <Avatar className="size-7 border border-tp-outline-variant/50">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-tp-on-surface leading-tight">
                    {userName || 'User'}
                  </span>
                  <span className="text-[10px] text-tp-outline leading-tight">
                    ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{userName || 'User'}</span>
                  <span className="text-xs text-muted-foreground">Paper Trading Account</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentPage('reports')}>
                My Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
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
                <Avatar className="size-7 border border-tp-outline-variant/50">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{userName || 'User'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
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
