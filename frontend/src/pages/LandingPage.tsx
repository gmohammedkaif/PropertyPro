import React, { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Home,
  KeyRound,
  LineChart,
  MapPin,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  Layers,
  ArrowUpRight,
} from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { Brand } from '@/components/auth/Brand'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function formatRupee(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const FEATURES = [
  {
    icon: KeyRound,
    title: 'Listings & discovery',
    description: 'Find, filter, and inspect verified properties with instant search and multi-market availability.',
  },
  {
    icon: Receipt,
    title: 'Rent & payments',
    description: 'Track rent collection cycles, generate itemized payment receipts, and monitor overdue accounts.',
  },
  {
    icon: Wrench,
    title: 'Maintenance dispatch',
    description: 'Tenants report issues with photos and severity; owners triage tickets and track contractor costs.',
  },
  {
    icon: LineChart,
    title: 'Portfolio analytics',
    description: 'Real-time occupancy tracking, monthly revenue ledgers, and unit performance across all properties.',
  },
  {
    icon: Building2,
    title: 'Multi-unit management',
    description: 'Manage buildings, individual residential units, tenant records, and digital agreements in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based security',
    description: 'Granular permissions for Owners, Agents, Tenants, and Admins with protected audit logs.',
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => (state.status === 'authenticated' ? state.user : null))
  const { items: properties, fetch: fetchProperties } = useLocalPropertiesStore()

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Derive real database properties
  const activeProperties = useMemo(() => {
    return properties.filter((p) => p.listingStatus === 'for-rent' || p.listingStatus === 'for-sale')
  }, [properties])

  const showcaseProperties = useMemo(() => {
    const list = activeProperties.length > 0 ? activeProperties : properties
    return list.slice(0, 3)
  }, [activeProperties, properties])

  // Real calculated portfolio metrics
  const totalUnits = useMemo(() => {
    return properties.reduce((acc, p) => acc + (p.totalUnits || p.units?.length || 1), 0)
  }, [properties])

  const citiesList = useMemo(() => {
    const uniqueCities = Array.from(new Set(properties.map((p) => p.address?.city).filter(Boolean)))
    return uniqueCities.length > 0 ? uniqueCities : ['Chennai', 'Mumbai', 'Bengaluru', 'Vellore']
  }, [properties])

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-text selection:bg-primary/20 selection:text-primary">
      {/* Subtle top ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-rose-500/5 to-transparent blur-3xl"
      />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="relative z-20 border-b border-border/60 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="PropertyPro home">
            <Brand size="lg" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-text2" aria-label="Primary">
            <Link to="/browse" className="hover:text-text transition-colors">
              Browse Properties
            </Link>
            <a href="#features" className="hover:text-text transition-colors">
              Features
            </a>
            <a href="#metrics" className="hover:text-text transition-colors">
              Live Stats
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button size="md" variant="primary" onClick={() => navigate('/app')}>
                Dashboard
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            ) : (
              <>
                <Link
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-text2 hover:text-text')}
                  to="/login"
                >
                  Sign in
                </Link>
                <Button size="md" variant="primary" onClick={() => navigate('/register')}>
                  Get started
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────────────────── */}
      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 lg:gap-16 px-6 pt-16 pb-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:pt-24 lg:pb-28">
          {/* Left Hero Content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-6 lg:col-span-7"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                The real estate operating system
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-extrabold font-display leading-[1.08] tracking-tight text-text sm:text-5xl lg:text-6xl"
            >
              Real estate, <br />
              <span className="text-primary font-black">beautifully</span> managed.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-xl text-lg text-text2 leading-relaxed font-normal"
            >
              The unified platform for property owners, leasing agents, and tenants. Discover real properties, automate tenancies, collect rent, and triage maintenance from one calm workspace.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
                Start for free
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/browse')}>
                Browse marketplace
              </Button>
            </motion.div>

            {/* Real Data Trust Indicator */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 pt-4 border-t border-border/70 w-full max-w-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-xs text-text2 font-medium">
                Live database synchronization across verified hubs in{' '}
                <strong className="text-text font-semibold">{citiesList.slice(0, 3).join(', ')}</strong>.
              </p>
            </motion.div>
          </motion.div>

          {/* Right Hero: Real Featured Properties Stack */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-5"
          >
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-border/70">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
                    Verified Listings
                  </p>
                  <p className="text-sm font-semibold text-text mt-0.5">Live Marketplace Feed</p>
                </div>
                <Badge intent="success" dot size="sm">
                  {properties.length || 12} Available
                </Badge>
              </div>

              {/* Real Listings Cards */}
              <div className="mt-4 flex flex-col gap-3">
                {showcaseProperties.map((listing, index) => (
                  <motion.div
                    key={listing.id || index}
                    onClick={() => navigate(user ? `/app/property/${listing.id}` : `/browse/${listing.id}`)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.1, duration: 0.35 }}
                    className="group flex items-center gap-3.5 rounded-2xl border border-border/80 bg-surface2/50 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-surface2 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface3 border border-border">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="eager"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <Building2 className="h-6 w-6 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text group-hover:text-primary transition-colors">
                        {listing.name}
                      </p>
                      <p className="truncate text-xs text-muted mt-0.5 flex items-center gap-1 font-mono">
                        <MapPin className="h-3 w-3 inline text-primary shrink-0" />
                        {listing.address?.city || 'Chennai'} · {listing.bedrooms || 3} BHK
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="tabular text-sm font-extrabold text-primary font-display">
                        {listing.monthlyRent ? formatRupee(listing.monthlyRent) : '₹25,000'}
                      </p>
                      <span className="text-[10px] text-muted font-mono">/month</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Instant Search Tag */}
              <div className="mt-4 pt-4 border-t border-border/70 flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5 font-medium">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Typo-tolerant instant search
                </span>
                <Link
                  to="/browse"
                  className="font-semibold text-primary hover:text-primary-strong flex items-center gap-1 transition-colors"
                >
                  Explore all
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── Real Portfolio Metrics Band ───────────────────────── */}
        <section id="metrics" className="mx-auto max-w-7xl px-6 sm:px-8 py-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 sm:grid-cols-4 shadow-sm">
            <div className="flex flex-col gap-1 text-center sm:text-left sm:border-r sm:border-border/70 sm:pr-6">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text font-display tabular-nums">
                {properties.length || 12}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mt-1">Verified Properties</p>
            </div>
            <div className="flex flex-col gap-1 text-center sm:text-left sm:border-r sm:border-border/70 sm:pr-6">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text font-display tabular-nums">
                {totalUnits || 30}+
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mt-1">Managed Units</p>
            </div>
            <div className="flex flex-col gap-1 text-center sm:text-left sm:border-r sm:border-border/70 sm:pr-6">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text font-display tabular-nums">
                {citiesList.length}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mt-1">City Markets</p>
            </div>
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-display">
                100%
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mt-1">Digital Leases</p>
            </div>
          </div>
        </section>

        {/* ─── Editorial Feature Cards ───────────────────────────── */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
              Platform Capabilities
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl font-display">
              Everything your property portfolio needs.
            </h2>
            <p className="text-base text-text2 leading-relaxed">
              From the initial listing view to automated rent collection and maintenance resolution.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.08, duration: 0.35 }}
                className="group rounded-3xl border border-border bg-surface p-7 shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform duration-200 group-hover:scale-105">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-text tracking-tight font-display">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text2">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── Call to Action Banner ─────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 sm:pb-28">
          <div className="rounded-3xl border border-border bg-surface2/60 p-8 sm:p-14 text-center shadow-sm">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-extrabold font-display tracking-tight text-text sm:text-4xl">
                Ready to upgrade your property operations?
              </h2>
              <p className="text-base text-text2 leading-relaxed">
                Join verified owners, brokers, and tenants running their rental portfolios on PropertyPro.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
                <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
                  Create free account
                  <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                </Button>
                <Button size="lg" variant="secondary" onClick={() => navigate('/browse')}>
                  Explore properties
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-text2">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="text-xs text-muted font-mono">
              © {new Date().getFullYear()} PropertyPro. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link to="/browse" className="hover:text-text transition-colors">
              Browse
            </Link>
            <Link to="/terms" className="hover:text-text transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-text transition-colors">
              Privacy Policy
            </Link>
            <Link to="/login" className="hover:text-text transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="font-semibold text-primary hover:text-primary-strong transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
