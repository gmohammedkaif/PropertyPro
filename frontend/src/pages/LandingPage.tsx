import { Link, useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  Home,
  KeyRound,
  LineChart,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const FEATURES = [
  {
    icon: KeyRound,
    title: 'Listings & discovery',
    description: 'Publish once, reach everywhere. Typo-tolerant search with faceted, geo filters.',
  },
  {
    icon: Receipt,
    title: 'Rent & payments',
    description:
      'Collect rent securely, issue receipts, and stay on top of reminders and late fees.',
  },
  {
    icon: Wrench,
    title: 'Maintenance',
    description: 'Tenant-friendly tickets, AI triage, SLA tracking, and cost controls for owners.',
  },
  {
    icon: LineChart,
    title: 'Analytics',
    description: 'Portfolio value, occupancy, revenue, and maintenance trends at a glance.',
  },
  {
    icon: Building2,
    title: 'Portfolio management',
    description: 'Properties, units, leases, and tenants — organized and fully searchable.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    description: 'Role-based access, audit logs, and OWASP-aligned security throughout.',
  },
]

const MOCK_LISTINGS = [
  { title: 'Skyline Loft', price: '$1,850/mo', area: 'Downtown', beds: '2 bd · 2 ba' },
  { title: 'Harborview Residences', price: '$2,400/mo', area: 'Riverside', beds: '3 bd · 2 ba' },
  { title: 'Maple Court Studio', price: '$1,150/mo', area: 'Midtown', beds: '1 bd · 1 ba' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      {/* Ambient gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-cyan-500/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl"
      />

      <header className="relative z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="PropertyPro home">
            <span className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md">
              <Home className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-text">
              Property<span className="text-primary">Pro</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))} to="/browse">
              Browse
            </Link>
            <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))} to="/login">
              Sign in
            </Link>
          </nav>

          <Button size="sm" onClick={() => navigate('/register')}>
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-24">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-6"
          >
            <motion.div variants={fadeUp}>
              <Badge intent="primary" size="md">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                The complete real estate platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-extrabold font-display leading-[1.05] tracking-tighter text-text sm:text-5xl lg:text-6xl"
            >
              Real estate & property management,{' '}
              <span className="text-gradient">beautifully unified</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-md text-base text-text2 sm:text-lg font-sans leading-relaxed">
              Own, sell, rent, and maintain — PropertyPro brings owners, agents, buyers, tenants,
              and staff into one polished, secure workspace.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate('/register')}>
                Start for free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/app')}>
                Explore the app
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                <Avatar name="Priya Sharma" size="sm" />
                <Avatar name="Alec Brandt" size="sm" />
                <Avatar name="Maya Lin" size="sm" />
                <Avatar name="Dani Ruiz" size="sm" />
              </div>
              <p className="text-xs text-muted">Trusted by owners, agents, buyers & tenants.</p>
            </motion.div>
          </motion.div>

          {/* Floating glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between px-1 pb-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
                    Featured listings
                  </p>
                </div>
                <Badge intent="success" dot size="sm">
                  42 live
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {MOCK_LISTINGS.map((listing, index) => (
                  <motion.div
                    key={listing.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface/80 p-3 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="bg-brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white/90 shadow-sm shadow-primary/20">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text">{listing.title}</p>
                      <p className="truncate text-xs text-muted">
                        {listing.area} · {listing.beds}
                      </p>
                    </div>
                    <p className="tabular shrink-0 text-sm font-extrabold text-primary">
                      {listing.price}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass absolute -bottom-6 -right-3 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-soft text-success">
                <Search className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">Instant search</p>
                <p className="text-xs text-muted">Typo-tolerant & geo-aware</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Stats band */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="glass grid grid-cols-2 gap-6 rounded-2xl px-6 py-8 sm:grid-cols-4">
            {[
              { value: '5+', label: 'Roles unified' },
              { value: '99.9%', label: 'Uptime target' },
              { value: '<150ms', label: 'Search latency' },
              { value: 'AA', label: 'Accessibility' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                className="flex flex-col gap-1 text-center"
              >
                <p className="tabular text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-muted">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Everything your property needs
            </h2>
            <p className="text-sm text-muted sm:text-base">
              One platform from the first viewing to the final invoice.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % 3) * 0.08, duration: 0.35 }}
                    className="rounded-2xl border border-border/80 bg-surface/50 p-6 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1 hover:bg-surface"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/25">
                      <feature.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-text tracking-tight">{feature.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.description}</p>
                  </motion.div>
                ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} PropertyPro. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <Link to="/login" className="transition-colors hover:text-text">
              Sign in
            </Link>
            <Link to="/register" className="transition-colors hover:text-text">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
