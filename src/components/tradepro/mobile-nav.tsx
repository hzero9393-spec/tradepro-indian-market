'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  Crosshair,
  FileText,
  Wallet,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'trading', label: 'Stocks', icon: CandlestickChart },
  { id: 'positions', label: 'Positions', icon: Crosshair },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
]

export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div
        className="flex h-16 w-full items-center justify-around px-2"
        style={{
          background: '#111827',
          borderTop: '1px solid #1f2937',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {mobileNavItems.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors duration-200 outline-none rounded-lg',
                'focus-visible:ring-2 focus-visible:ring-amber-500/30',
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon
                  className={cn(
                    'size-5 transition-all duration-200',
                    isActive && 'scale-105',
                  )}
                  style={{ color: isActive ? '#fbbf24' : '#6b7280' }}
                />
                {/* Active dot indicator */}
                {isActive && (
                  <div
                    className="h-1 w-1 rounded-full"
                    style={{ background: '#f59e0b' }}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight transition-colors duration-200',
                  isActive && 'font-semibold',
                )}
                style={{ color: isActive ? '#fbbf24' : '#6b7280' }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
