'use client'

import { useAppStore } from '@/lib/store'
import {
  Shield,
  FileText,
  Headphones,
  Mail,
  HelpCircle,
  AlertTriangle,
  Info,
  RotateCcw,
  TrendingUp,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle
} from 'lucide-react'

const footerLinks = [
  { id: 'about-us' as const, label: 'About Us', icon: Info, description: 'Know more about TradePro' },
  { id: 'privacy-policy' as const, label: 'Privacy Policy', icon: Shield, description: 'How we handle your data' },
  { id: 'terms-of-service' as const, label: 'Terms of Service', icon: FileText, description: 'Terms & conditions' },
  { id: 'disclaimer' as const, label: 'Disclaimer', icon: AlertTriangle, description: 'Important legal notice' },
  { id: 'support' as const, label: 'Support', icon: Headphones, description: 'Get help & assistance' },
  { id: 'contact-us' as const, label: 'Contact Us', icon: Mail, description: 'Reach out to us' },
  { id: 'faq' as const, label: 'FAQ', icon: HelpCircle, description: 'Frequently asked questions' },
  { id: 'refund-policy' as const, label: 'Refund Policy', icon: RotateCcw, description: 'Refund information' },
]

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
  { icon: MessageCircle, label: 'Discord', href: '#' },
]

export function Footer() {
  const { setCurrentPage } = useAppStore()

  const handleLinkClick = (pageId: Parameters<typeof setCurrentPage>[0]) => {
    setCurrentPage(pageId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer
      className="px-4 sm:px-6 pt-10 pb-6"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Brand & Description */}
        <div className="flex flex-col md:flex-row gap-8 pb-8" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="md:w-1/3">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ background: '#5367ff', color: '#ffffff' }}
              >
                <TrendingUp className="size-5" />
              </div>
              <span className="text-xl font-bold" style={{ color: '#1a1a2e' }}>TradePro</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
              India&apos;s most trusted paper trading platform. Practice trading NIFTY, BANKNIFTY, SENSEX options, futures & stocks risk-free with ₹1,00,000 virtual money.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map((social) => (
                <button
                  key={social.label}
                  className="flex size-9 items-center justify-center rounded-lg transition-colors"
                  style={{
                    background: '#f3f4f6',
                    color: '#6b7280',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#5367ff'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                  aria-label={social.label}
                >
                  <social.icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:w-1/3">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>Quick Links</h3>
            <div className="grid grid-cols-2 gap-1">
              {footerLinks.slice(0, 4).map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors text-sm group"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                    e.currentTarget.style.color = '#1a1a2e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  <link.icon className="size-3.5 shrink-0" style={{ color: '#5367ff' }} />
                  <span className="group-hover:font-medium">{link.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Help & Support */}
          <div className="md:w-1/3">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>Help & Support</h3>
            <div className="grid grid-cols-2 gap-1">
              {footerLinks.slice(4).map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors text-sm group"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                    e.currentTarget.style.color = '#1a1a2e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  <link.icon className="size-3.5 shrink-0" style={{ color: '#5367ff' }} />
                  <span className="group-hover:font-medium">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div
          className="my-6 px-4 py-3 rounded-lg"
          style={{ background: '#fef3c7', border: '1px solid #fde68a' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
            <strong>⚠️ Disclaimer:</strong> TradePro is a paper trading simulator for educational purposes only. 
            No real money is involved. Market data may be delayed. This is not financial advice. 
            Trading in real markets involves substantial risk of loss.
          </p>
        </div>

        {/* Bottom Section */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4"
          style={{ borderTop: '1px solid #f0f0f0' }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
            <span>© 2025 TradePro.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#9ca3af' }}>
            <span>Paper Trading Simulator</span>
            <span>•</span>
            <span>No Real Money</span>
            <span>•</span>
            <span>Learning Only</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
