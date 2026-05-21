'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { AuthPage } from '@/components/tradepro/auth-page'
import { Sidebar } from '@/components/tradepro/sidebar'
import { TopBar } from '@/components/tradepro/topbar'
import { MobileNav } from '@/components/tradepro/mobile-nav'
import { DashboardPage } from '@/components/tradepro/pages/dashboard-page'
import { TradingPage } from '@/components/tradepro/pages/trading-page'
import PortfolioPage from '@/components/tradepro/pages/portfolio-page'
import { OrdersPage } from '@/components/tradepro/pages/orders-page'
import { PositionsPage } from '@/components/tradepro/pages/positions-page'
import { ReportsPage } from '@/components/tradepro/pages/reports-page'
import { ProfilePage } from '@/components/tradepro/pages/profile-page'
import { OptionChainPage } from '@/components/tradepro/pages/option-chain-page'
import { FuturesPage } from '@/components/tradepro/pages/futures-page'
import { LearningPage } from '@/components/tradepro/pages/learning-page'
import { IndexTicker } from '@/components/tradepro/index-ticker'
import { TradeSuccessProvider } from '@/components/tradepro/trade-success-popup'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TrendingUp } from 'lucide-react'

function PageContent({ page }: { page: string }) {
  switch (page) {
    case 'dashboard':
      return <DashboardPage />
    case 'trading':
      return <TradingPage />
    case 'positions':
      return <PositionsPage />
    case 'orders':
      return <OrdersPage />
    case 'portfolio':
      return <PortfolioPage />
    case 'reports':
      return <ReportsPage />
    case 'optionChain':
      return <OptionChainPage />
    case 'futures':
      return <FuturesPage />
    case 'learning':
      return <LearningPage />
    case 'profile':
      return <ProfilePage />
    default:
      return <DashboardPage />
  }
}

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0e17' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex size-14 items-center justify-center rounded-2xl animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
          }}
        >
          <TrendingUp className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-[#f9fafb]">StockVerse</h2>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            Loading your trading desk...
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <div
            className="size-2 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="size-2 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="size-2 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { currentPage, sidebarOpen, setSidebarOpen } = useAppStore()
  const { isAuthenticated, isInitializing, initialize, logout, user, token } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Show loading while checking auth
  if (isInitializing) {
    return <LoadingScreen />
  }

  // Show auth page if not logged in
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Ignore logout API errors
    }
    logout()
  }

  return (
    <TradeSuccessProvider>
      <div className="flex min-h-screen flex-col" style={{ background: '#0a0e17' }}>
        {/* Desktop Sidebar */}
        <Sidebar onLogout={handleLogout} userName={user?.name} userEmail={user?.email} userRole={user?.role} />

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[260px] p-0"
            style={{ background: '#111827', borderRight: '1px solid #1f2937' }}
          >
            <Sidebar onLogout={handleLogout} userName={user?.name} userEmail={user?.email} userRole={user?.role} />
          </SheetContent>
        </Sheet>

        {/* Top Bar */}
        <TopBar userName={user?.name} onLogout={handleLogout} />

        {/* Indian Market Index Ticker */}
        <IndexTicker />

        {/* Main Content */}
        <main className="flex-1 md:ml-[260px] pt-20 pb-20 md:pb-0">
          <PageContent page={currentPage} />

          {/* Sticky Footer */}
          <footer
            className="px-6 py-4"
            style={{
              background: '#111827',
              borderTop: '1px solid #1f2937',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <div
                  className="flex size-6 items-center justify-center rounded-md"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                  }}
                >
                  <TrendingUp className="size-3.5" />
                </div>
                <span className="text-sm font-semibold text-[#f9fafb]">StockVerse</span>
                <span className="text-xs" style={{ color: '#6b7280' }}>© 2025</span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#6b7280' }}>
                <span>Paper Trading Simulator</span>
                <span>•</span>
                <span>No Real Money</span>
                <span>•</span>
                <span>Learning Only</span>
              </div>
            </div>
          </footer>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileNav />
      </div>
    </TradeSuccessProvider>
  )
}
