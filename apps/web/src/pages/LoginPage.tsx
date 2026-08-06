import { useState, type FormEvent, useEffect } from 'react'
import { Lock, Mail, Eye, EyeOff, User, Key } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useLogin } from '@/hooks/useAuth'
import { loginSchema } from '@/lib/authValidators'
import { useAuthStore, demoTenant } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'
  const { signIn } = useAuthStore()
  const toast = useToast()

  const handleDemoSignIn = (user: typeof demoTenant) => {
    signIn(user, 'demo-token')
    toast.success(`Signed in as ${user.name}`)
    navigate(from, { replace: true })
  }

  // Live validation logic
  useEffect(() => {
    const errors: Record<string, string> = {}
    
    if (!email.trim()) {
      errors.email = 'Please enter your email.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Enter a valid email address.'
      }
    }
    
    if (!password) {
      errors.password = 'Please enter your password.'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    setFieldErrors(errors)
  }, [email, password])

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitted(true)
    setApiError(null)

    // Trigger touched for all inputs on submit
    setTouched({ email: true, password: true })

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      return
    }

    login.mutate(parsed.data, {
      onSuccess: () => {
        if (rememberMe) {
          localStorage.setItem('propertypro_remembered_email', email)
        } else {
          localStorage.removeItem('propertypro_remembered_email')
        }
        navigate(from, { replace: true })
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (message.includes('429') || message.toLowerCase().includes('too many requests')) {
          setApiError('Too many attempts. Please try again after some time.')
        } else if (message.includes('404') || message.toLowerCase().includes('user not found') || message.toLowerCase().includes('not registered')) {
          setApiError('This email is not registered. Please create an account.')
        } else if (message.includes('401') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('email or password')) {
          setApiError('Invalid credentials. Please verify your email and password.')
        } else if (message.toLowerCase().includes('disabled') || message.includes('403')) {
          setApiError('Account is disabled. Please contact your system administrator.')
        } else {
          setApiError(message)
        }
      },
    })
  }

  // Pre-fill remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('propertypro_remembered_email')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const getErrorToShow = (field: 'email' | 'password') => {
    if (!isSubmitted && !touched[field]) return undefined
    return fieldErrors[field]
  }

  return (
    <AuthLayout variant="split" title="Welcome back" description="Sign in to your PropertyPro workspace.">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <EnhancedInput
          type="email"
          label="Email address"
          placeholder="name@propertypro.app"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => handleBlur('email')}
          error={getErrorToShow('email')}
          autoComplete="email"
          required
          focusColor="primary"
        />
        
        <EnhancedInput
          type={showPassword ? 'text' : 'password'}
          label="Password"
          labelRight={
            <Link 
              to="/forgot-password" 
              className="text-xs font-semibold text-primary hover:text-primary-strong transition-colors duration-200"
            >
              Forgot password?
            </Link>
          }
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
          onBlur={() => handleBlur('password')}
          error={getErrorToShow('password')}
          autoComplete="current-password"
          required
          focusColor="primary"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-text select-none group">
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              className="h-4.5 w-4.5 rounded border-border/40 bg-black/30 text-primary focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer accent-primary"
            />
            <span className="text-text2 group-hover:text-text transition-colors duration-200">Remember me</span>
          </label>
        </div>
        
        {apiError ? (
          <div className="rounded-lg border border-danger/30 bg-danger-soft/20 p-4 text-xs font-medium text-danger backdrop-blur-sm animate-in fade-in-50 duration-200" role="alert">
            {apiError}
          </div>
        ) : null}
        
        <EnhancedButton
          type="submit"
          size="lg"
          disabled={login.isPending}
          loading={login.isPending}
          className="w-full h-[54px] text-sm font-semibold tracking-wide hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg transition-all duration-200"
          glowIntensity="high"
          shimmer={true}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </EnhancedButton>
      </form>

      {/* Quick Demo Sign In */}
      <div className="flex flex-col gap-2">
        <p className="text-center text-xs text-muted">Or continue with demo account:</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDemoSignIn({ id: 'usr_demo', name: 'Alex Morgan', email: 'alex@propertypro.app', roles: ['owner', 'agent'] })}
            leftIcon={<User className="h-4 w-4" />}
          >
            Owner Demo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDemoSignIn(demoTenant)}
            leftIcon={<Key className="h-4 w-4" />}
          >
            Tenant Demo
          </Button>
        </div>
      </div>

      {/* Switch Account / Sign Out */}
      <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-danger hover:text-danger/80"
          onClick={() => {
            useAuthStore.getState().signOut()
            window.location.reload()
          }}
        >
          Sign out / Switch account
        </Button>
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