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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 glass w-full max-w-[520px] rounded-2xl p-8 sm:p-10 border border-border/40">
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
      {/* Left side: Premium Image Panel */}
      <div 
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/login_house_bg.png')" }}
      >
        {/* Dark radial gradient overlay for text readability and aesthetic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/60 z-0" />
        
        {/* Floating Brand Section */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Brand />
        </div>
 
        {/* Testimonial Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} 
          className="relative z-10 max-w-lg border border-white/10 rounded-2xl p-8 backdrop-blur-xl bg-black/50 shadow-2xl"
        >
          <p className="text-xl font-medium leading-relaxed tracking-tight text-white/90">
            “Running six units used to mean spreadsheets and missed calls. PropertyPro put the whole portfolio on one screen.”
          </p>
          <footer className="mt-6 flex items-center gap-3">
            <span className="bg-primary/20 border border-primary/30 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white">
              PS
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Priya Sharma</p>
              <p className="text-xs text-white/60">Property owner · 6 units</p>
            </div>
          </footer>
        </motion.div>
 
        {/* Feature List Overlay */}
        <ul className="relative z-10 flex flex-col gap-3.5 text-sm font-medium text-white/80">
          {[
            { icon: Building2, label: 'Owners, agents, buyers & tenants in one workspace' },
            { icon: ShieldCheck, label: 'Role-based access and a full audit trail' },
            { icon: ArrowRight, label: 'Rent, maintenance, and analytics — end to end' },
          ].map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
 
      {/* Right side: Form Panel */}
      <div className="relative flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} 
          className="glass w-full max-w-[520px] rounded-2xl p-8 sm:p-10 border border-border/40"
        >
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