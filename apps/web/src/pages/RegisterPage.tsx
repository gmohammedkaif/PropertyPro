import { useState, type FormEvent } from 'react'
import { Lock, Mail, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { RoleSelector } from '@/components/auth/RoleSelector'
import { useRegister } from '@/hooks/useAuth'
import { registerSchema } from '@/lib/authValidators'

export function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('buyer')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const register = useRegister()
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setApiError(null)

    const parsed = registerSchema.safeParse({ email, password, firstName, lastName, role })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    register.mutate(parsed.data, {
      onSuccess: () => {
        navigate('/app', { replace: true })
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (message.includes('already exists')) {
          setApiError('An account with this email already exists.')
        } else {
          setApiError(message)
        }
      },
    })
  }

  return (
    <AuthLayout variant="centered" title="Create your account" description="Start managing property in minutes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="Alex"
            leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={fieldErrors.firstName}
            autoComplete="given-name"
            required
          />
          <Input
            label="Last name"
            placeholder="Morgan"
            leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={fieldErrors.lastName}
            autoComplete="family-name"
            required
          />
        </div>
        <Input
          type="email"
          label="Email address"
          placeholder="you@propertypro.app"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="new-password"
          required
        />
        <PasswordStrength value={password} />
        <RoleSelector value={role} onChange={setRole} error={fieldErrors.role} />
        {apiError ? (
          <div className="rounded-lg border border-danger/40 bg-danger-soft/50 p-3 text-sm text-danger" role="alert">
            {apiError}
          </div>
        ) : null}
        <Button type="submit" size="lg" loading={register.isPending} className="mt-2 w-full">
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-strong">Sign in</Link>
      </p>
    </AuthLayout>
  )
}