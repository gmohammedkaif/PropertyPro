import { useState, type FormEvent } from 'react'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useLogin } from '@/hooks/useAuth'
import { loginSchema } from '@/lib/authValidators'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setApiError(null)

    const errors: Record<string, string> = {}
    if (!email.trim()) {
      errors.email = 'Please enter your email.'
    }
    if (!password) {
      errors.password = 'Please enter your password.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      }
      setFieldErrors(fieldErrors)
      return
    }

    login.mutate(parsed.data, {
      onSuccess: () => {
        navigate(from, { replace: true })
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (message.includes('429') || message.toLowerCase().includes('too many requests')) {
          setApiError('Too many requests. Please wait a moment before trying again.')
        } else if (message.includes('404') || message.toLowerCase().includes('user not found') || message.toLowerCase().includes('not registered')) {
          setApiError('This email is not registered. Please create an account.')
        } else if (message.includes('401') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('email or password')) {
          setApiError('Invalid email or password. Please verify your credentials.')
        } else {
          setApiError(message)
        }
      },
    })
  }

  return (
    <AuthLayout variant="split" title="Welcome back" description="Sign in to your PropertyPro workspace.">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <EnhancedInput
          type="email"
          label="Email address"
          placeholder="name@propertypro.app"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          required
          focusColor="primary"
        />
        
        <EnhancedInput
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text2/60 hover:text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
          focusColor="primary"
        />
        
        {apiError ? (
          <div className="rounded-lg border border-danger/40 bg-danger-soft/30 p-4 text-sm text-danger backdrop-blur-sm" role="alert">
            {apiError}
          </div>
        ) : null}
        
        <EnhancedButton
          type="submit"
          size="lg"
          loading={login.isPending}
          className="mt-4 w-full font-medium"
          glowIntensity="high"
          shimmer={true}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </EnhancedButton>
      </form>
      
      <p className="mt-8 text-center text-xs text-muted">
        By signing in, you agree to our{' '}
        <Link to="/terms" className="font-medium text-primary transition-colors hover:text-primary-strong">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" className="font-medium text-primary transition-colors hover:text-primary-strong">Privacy Policy</Link>
      </p>
      
      <p className="mt-4 text-center text-xs text-muted">
        New to PropertyPro?{' '}
        <Link to="/register" className="font-medium text-primary transition-colors hover:text-primary-strong">Create an account</Link>
      </p>
    </AuthLayout>
  )
}