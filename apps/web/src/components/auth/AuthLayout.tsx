import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'

import { ArrowRight, Building2, ShieldCheck } from 'lucide-react'

import { Brand } from './Brand'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface AuthLayoutProps {
  variant?: 'split' | 'centered'
  title: string
  description: string
  children: React.ReactNode
}

export function AuthLayout({
  variant = 'split',
  title,
  description,
  children,
}: PropsWithChildren<AuthLayoutProps>) {
  if (variant === 'centered') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-violet-500/15 to-transparent blur-3xl" />
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 mb-8 flex items-center gap-2.5">
          <Brand />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 glass w-full max-w-sm rounded-2xl p-8">
          <div className="mb-8 flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
            <p className="text-sm text-muted">{description}</p>
          </div>
          {children}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-violet-500/15 to-transparent blur-3xl" />
        <div className="relative z-10 flex items-center gap-2.5">
          <Brand />
        </div>
        <motion.blockquote initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 max-w-md">
          <p className="text-2xl font-semibold leading-snug tracking-tight text-text">“Running six units used to mean spreadsheets and missed calls. PropertyPro put the whole portfolio on one screen.”</p>
          <footer className="mt-6 flex items-center gap-3">
            <span className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white">PS</span>
            <div>
              <p className="text-sm font-semibold text-text">Priya Sharma</p>
              <p className="text-xs text-muted">Property owner · 6 units</p>
            </div>
          </footer>
        </motion.blockquote>
        <ul className="relative z-10 flex flex-col gap-3 text-sm text-muted">
          {[
            { icon: Building2, label: 'Owners, agents, buyers & tenants in one workspace' },
            { icon: ShieldCheck, label: 'Role-based access and a full audit trail' },
            { icon: ArrowRight, label: 'Rent, maintenance, and analytics — end to end' },
          ].map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass w-full max-w-sm rounded-2xl p-8">
          <div className="mb-8 flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
            <p className="text-sm text-muted">{description}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}