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

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    login.mutate(parsed.data, {
      onSuccess: () => {
        navigate(from, { replace: true })
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (message.includes('email or password')) {
          setApiError('Invalid email or password.')
        } else {
          setApiError(message)
        }
      },
    })
  }

  return (
    <AuthLayout variant="split" title="Welcome back" description="Sign in to your PropertyPro workspace.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <EnhancedInput
          type="email"
          label="Email address"
          placeholder="you@propertypro.app"
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
              className="text-muted hover:text-primary transition-colors"
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
          className="mt-2 w-full font-medium"
          glowIntensity="high"
          shimmer={true}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </EnhancedButton>
      </form>
      
      <div className="mt-8 flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface/80 backdrop-blur-sm px-3 text-muted">Or continue with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="glass rounded-lg px-4 py-3 text-sm font-medium text-text hover:bg-white/5 hover:border-primary/30 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.3-4.76 3.3-8.14z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A9.97 9.97 0 0 0 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.33-1.36-.33-2.09s.11-1.43.33-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.78z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.42 1 3.74 4.03 2.18 8.14l3.86 2.97c.71-2.57 2.86-4.44 5.46-4.44z" />
              </svg>
              Google
            </span>
          </button>
          
          <button
            type="button"
            className="glass rounded-lg px-4 py-3 text-sm font-medium text-text hover:bg-white/5 hover:border-primary/30 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.318 2.034-5.13 5-5.13 1.421 0 2.665.106 3.024.154v3.17h-2.078c-1.629 0-1.943.772-1.943 1.906v2.253h3.887l-.497 3.622h-3.39v9.294h6.558c.732 0 1.325-.593 1.325-1.325v-21.351c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
              Microsoft
            </span>
          </button>
        </div>
      </div>
      
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