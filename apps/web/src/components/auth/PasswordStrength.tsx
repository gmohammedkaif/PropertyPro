import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  value: string
}

export function PasswordStrength({ value }: PasswordStrengthProps) {
  if (!value) return null
  const { score } = passwordStrength(value)
  const colors = ['bg-danger', 'bg-warning', 'bg-primary', 'bg-success', 'bg-success']
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent']

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-150', i <= score ? colors[score] : 'bg-border')}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{labels[score]} password</p>
    </div>
  )
}

function passwordStrength(value: string): { score: number; label: string } {
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  return { score: Math.min(score, 4), label: ['weak', 'fair', 'good', 'strong', 'excellent'][Math.min(score, 4)] }
}