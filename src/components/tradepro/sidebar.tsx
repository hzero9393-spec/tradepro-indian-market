'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  Crosshair,
  FileText,
  Wallet,
  BarChart3,
  GraduationCap,
  User,
  LogOut,
  TrendingUp,
  GitBranch,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Stock', icon: CandlestickChart },
  { id: 'positions', label: 'Positions', icon: Crosshair },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'optionChain', label: 'Option Chain', icon: GitBranch },
  { id: 'futures', label: 'Futures', icon: TrendingUpIcon },
  { id: 'learning', label: 'Learn', icon: GraduationCap },
]

const bottomNavItems: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
]

interface SidebarProps {
  onLogout?: () => void
  userName?: string | null
  userEmail?: string | null
  userRole?: string | null
}

export function Sidebar({ onLogout, userName, userEmail }: SidebarProps) {
  const { currentPage, setCurrentPage } = useAppStore()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col md:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="glass-card flex h-full flex-col shadow-lg border-r border-tp-outline-variant/50">
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-tp-on-surface">
              TradePro
            </h1>
            <p className="text-[10px] font-medium tracking-wider text-tp-outline uppercase">
              Learning Simulator
            </p>
          </div>
        </div>

        <Separator className="mx-4 w-auto" />

        {/* User Profile Card */}
        {userName && (
          <div className="px-3 py-2.5">
            <button
              onClick={() => setCurrentPage('profile')}
              className="flex w-full items-center gap-3 rounded-xl bg-tp-surface-container-low p-2.5 hover:bg-tp-surface-container-low/80 transition-colors"
            >
              <Avatar className="size-8 border border-tp-outline-variant/50">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-tp-on-surface truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-tp-outline truncate">
                  {userEmail || 'Paper Trading'}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-2.5 py-1.5 custom-scrollbar">
          <nav className="flex flex-col gap-0.5">
            {mainNavItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 outline-none',
                    'hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-tp-on-surface-variant hover:text-tp-on-surface'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'size-4.5 transition-transform duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-primary'
                        : 'text-tp-outline group-hover:text-tp-on-surface'
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t border-tp-outline-variant/50 px-2.5 py-3">
          <nav className="flex flex-col gap-0.5">
            {bottomNavItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 outline-none',
                    'hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-tp-on-surface-variant hover:text-tp-on-surface'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'size-4.5 transition-transform duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-primary'
                        : 'text-tp-outline group-hover:text-tp-on-surface'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}

            <Separator className="my-1.5" />

            <button
              onClick={onLogout}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-tp-on-surface-variant transition-all duration-200 hover:bg-destructive/5 hover:text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <LogOut className="size-4.5 transition-transform duration-200 group-hover:scale-110" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
