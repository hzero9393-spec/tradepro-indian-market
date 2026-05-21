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
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Stocks', icon: CandlestickChart },
  { id: 'positions', label: 'Positions', icon: Crosshair },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'optionChain', label: 'Option Chain', icon: GitBranch },
  { id: 'futures', label: 'Futures', icon: TrendingUp },
  { id: 'learning', label: 'Learn', icon: GraduationCap },
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
    : 'SV'

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col md:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="flex h-full flex-col border-r"
        style={{
          background: '#111827',
          borderColor: '#1f2937',
        }}
      >
        {/* Branding Area */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div
            className="flex size-9 items-center justify-center rounded-xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            }}
          >
            <TrendingUp className="size-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#f9fafb]">
              StockVerse
            </h1>
            <p
              className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: '#9ca3af' }}
            >
              Market Simulator
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: '#1f2937' }} />

        {/* User Profile Card */}
        {userName && (
          <div className="px-3 py-3">
            <button
              onClick={() => setCurrentPage('profile')}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 transition-colors duration-200"
              style={{ background: '#0a0e17' }}
            >
              <Avatar className="size-8" style={{ border: '1px solid #1f2937' }}>
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[#f9fafb] truncate">
                  {userName}
                </p>
                <p className="text-[10px] truncate" style={{ color: '#9ca3af' }}>
                  {userEmail || 'Paper Trading'}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-1 custom-scrollbar-dark">
          <nav className="flex flex-col gap-0.5">
            {mainNavItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-amber-500/30',
                  )}
                  style={{
                    background: isActive ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    color: isActive ? '#fbbf24' : '#9ca3af',
                    borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'size-[18px] transition-all duration-200',
                    )}
                    style={{ color: isActive ? '#fbbf24' : '#6b7280' }}
                  />
                  <span className={cn(isActive && 'font-semibold')}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: '#f59e0b' }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid #1f2937' }}>
          <nav className="flex flex-col gap-0.5">
            {/* Profile */}
            <button
              onClick={() => setCurrentPage('profile')}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                'focus-visible:ring-2 focus-visible:ring-amber-500/30',
              )}
              style={{
                background: currentPage === 'profile' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                color: currentPage === 'profile' ? '#fbbf24' : '#9ca3af',
                borderLeft: currentPage === 'profile' ? '3px solid #f59e0b' : '3px solid transparent',
              }}
              aria-current={currentPage === 'profile' ? 'page' : undefined}
            >
              <User
                className="size-[18px] transition-all duration-200"
                style={{ color: currentPage === 'profile' ? '#fbbf24' : '#6b7280' }}
              />
              <span className={cn(currentPage === 'profile' && 'font-semibold')}>
                Profile
              </span>
            </button>

            {/* Sign Out */}
            <button
              onClick={onLogout}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-500/30"
              style={{ color: '#6b7280', borderLeft: '3px solid transparent' }}
            >
              <LogOut className="size-[18px] transition-all duration-200 group-hover:text-red-400" />
              <span className="group-hover:text-red-400 transition-colors duration-200">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </aside>
  )
}
