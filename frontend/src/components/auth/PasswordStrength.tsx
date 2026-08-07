import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  value: string
}

export function PasswordStrength({ value }: PasswordStrengthProps) {
  if (!value) return null
  
  const requirements = [
    { label: 'Minimum 8 characters', met: value.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(value) },
    { label: 'One lowercase letter', met: /[a-z]/.test(value) },
    { label: 'One number', met: /\d/.test(value) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(value) },
  ]

  const score = requirements.filter(r => r.met).length
  
  let label = 'Weak'
  let color = 'bg-danger'
  let barCount = 1

  if (score === 5) {
    label = 'Strong'
    color = 'bg-success'
    barCount = 4
  } else if (score === 4) {
    label = 'Good'
    color = 'bg-primary'
    barCount = 3
  } else if (score === 3) {
    label = 'Fair'
    color = 'bg-warning'
    barCount = 2
  } else {
    label = 'Weak'
    color = 'bg-danger'
    barCount = 1
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5" aria-live="polite">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-text2">Password Strength</span>
          <span className={cn('font-bold tracking-wide uppercase text-[10px] px-2 py-0.5 rounded-full bg-surface/50 border border-white/5', {
            'text-danger': label === 'Weak',
            'text-warning': label === 'Fair',
            'text-primary': label === 'Good',
            'text-success': label === 'Strong',
          })}>
            {label}
          </span>
        </div>
        <div className="flex gap-1.5 mt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn('h-1.5 flex-1 rounded-full transition-all duration-300', i <= barCount ? color : 'bg-white/10')}
            />
          ))}
        </div>
      </div>
      
      {/* Live requirements checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-black/10 border border-border/20 p-3 mt-1">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 text-success shrink-0 font-bold animate-in zoom-in-50 duration-200" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-text2/40 ml-1.5 shrink-0" />
            )}
            <span className={cn('transition-colors duration-200', req.met ? 'text-success/90 font-medium' : 'text-text2/60')}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}