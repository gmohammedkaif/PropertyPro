import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ArrowLeft, Printer, Shield, FileText, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export interface TocSection {
  id: string
  title: string
  icon?: React.ComponentType<{ className?: string }>
}

interface LegalLayoutProps {
  title: string
  description: string
  lastUpdated: string
  sections: TocSection[]
  children: React.ReactNode
}

export function LegalLayout({
  title,
  description,
  lastUpdated,
  sections,
  children,
}: LegalLayoutProps) {
  const location = useLocation()
  const user = useAuthStore((state) => (state.status === 'authenticated' ? state.user : null))
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')
  const [tocOpen, setTocOpen] = useState(false)

  const isTerms = location.pathname === '/terms'
  const isPrivacy = location.pathname === '/privacy'

  // Scrollspy to highlight active section in TOC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const top = element.offsetTop
          const height = element.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(id)
      setTocOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Background ambient gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-cyan-500/5 to-transparent blur-3xl"
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="PropertyPro home">
              <span className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-105">
                <Home className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-text">
                Property<span className="text-primary">Pro</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Secondary">
              <Link
                to="/browse"
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors text-muted hover:text-text hover:bg-surface-hover'
                )}
              >
                Browse
              </Link>
              <Link
                to="/terms"
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors',
                  isTerms
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted hover:text-text hover:bg-surface-hover'
                )}
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-colors',
                  isPrivacy
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted hover:text-text hover:bg-surface-hover'
                )}
              >
                Privacy Policy
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <Link
                to="/app"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Hero Header */}
      <section className="relative border-b border-border/60 bg-gradient-to-b from-surface/40 to-bg py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3.5 w-3.5" />
                <span>Official Legal Documentation</span>
                <span className="text-muted">•</span>
                <span className="text-text2">Last Updated: {lastUpdated}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                {title}
              </h1>
              <p className="text-base sm:text-lg text-muted leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4 text-muted" />
                Print / PDF
              </Button>
              <Link
                to={isTerms ? '/privacy' : '/terms'}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs text-muted hover:text-text')}
              >
                View {isTerms ? 'Privacy Policy' : 'Terms of Service'} →
              </Link>
            </div>
          </div>

          {/* Subtle Legal Notice Disclaimer Box */}
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs text-text2 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-text font-semibold">Legal Notice:</strong> This Privacy Policy and Terms of Service are provided as general platform terms and should be reviewed by qualified legal counsel before production use. PropertyPro provides a digital property management and rental marketplace software platform.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area: TOC Sidebar + Document Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Quick Table of Contents Toggle */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setTocOpen(!tocOpen)}
            className="w-full flex items-center justify-between rounded-xl border border-border bg-surface p-3.5 text-sm font-semibold text-text shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Table of Contents ({sections.length} Sections)</span>
            </div>
            <ChevronRight className={cn('h-4 w-4 text-muted transition-transform', tocOpen && 'rotate-90')} />
          </button>

          {tocOpen && (
            <div className="mt-2 rounded-xl border border-border bg-surface p-4 shadow-lg animate-in fade-in-50 duration-200">
              <nav className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {sections.map((section, idx) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                      activeSection === section.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted hover:text-text hover:bg-surface-hover'
                    )}
                  >
                    <span className="truncate">{idx + 1}. {section.title}</span>
                    {activeSection === section.id && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Desktop Sticky Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-border/80 bg-surface/60 p-5 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Table of Contents
                </h2>
              </div>
              <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 text-xs custom-scrollbar">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'text-muted hover:bg-surface-hover hover:text-text'
                      )}
                    >
                      <span className="truncate">
                        <span className="font-mono text-[11px] opacity-70 mr-1.5">{index + 1}.</span>
                        {section.title}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-2" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Legal Document Content */}
          <article className="lg:col-span-8 xl:col-span-9 space-y-10">
            {children}
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-surface/50 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-xs">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-tight text-text">
                Property<span className="text-primary">Pro</span>
              </span>
              <span className="text-xs text-muted ml-2">
                © {new Date().getFullYear()} PropertyPro. All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
              <Link to="/" className="hover:text-text transition-colors">
                Home
              </Link>
              <Link to="/browse" className="hover:text-text transition-colors">
                Browse Properties
              </Link>
              <Link to="/terms" className="hover:text-text transition-colors font-medium">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-text transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link to="/login" className="hover:text-text transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-text transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
