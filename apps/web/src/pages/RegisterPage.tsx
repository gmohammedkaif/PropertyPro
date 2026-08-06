import { useState, type FormEvent, useEffect } from 'react'
import { Lock, Mail, User, Eye, EyeOff, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
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
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [resendCountdown, setResendCountdown] = useState(0)
  
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  
  const register = useRegister()

  // Live validation logic
  useEffect(() => {
    const errors: Record<string, string> = {}
    
    if (!firstName.trim()) {
      errors.firstName = 'First name is required.'
    }
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required.'
    }
    
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
    } else {
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters.'
      } else if (!/[A-Z]/.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter.'
      } else if (!/[a-z]/.test(password)) {
        errors.password = 'Password must contain at least one lowercase letter.'
      } else if (!/\d/.test(password)) {
        errors.password = 'Password must contain at least one number.'
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        errors.password = 'Password must contain at least one special character.'
      }
    }

    if (!termsAccepted) {
      errors.terms = 'You must accept the Terms of Service and Privacy Policy.'
    }

    setFieldErrors(errors)
  }, [firstName, lastName, email, password, termsAccepted])

  // Resend Verification countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (resendCountdown === 0 && resendStatus === 'sent') {
      setResendStatus('idle')
    }
  }, [resendCountdown, resendStatus])

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleResendVerification = () => {
    setResendStatus('sending')
    setTimeout(() => {
      setResendStatus('sent')
      setResendCountdown(60)
    }, 1000)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitted(true)
    setApiError(null)

    // Mark all fields as touched on submit
    setTouched({ firstName: true, lastName: true, email: true, password: true, terms: true })

    const parsed = registerSchema.safeParse({ email, password, firstName, lastName, role })
    if (!parsed.success || !termsAccepted) {
      return
    }

    register.mutate(parsed.data, {
      onSuccess: () => {
        setIsRegistered(true)
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (message.toLowerCase().includes('already exists') || message.includes('409') || message.toLowerCase().includes('duplicate')) {
          setFieldErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }))
        } else {
          setApiError(message)
        }
      },
    })
  }

  const getErrorToShow = (field: string) => {
    if (!isSubmitted && !touched[field]) return undefined
    return fieldErrors[field]
  }

  if (isRegistered) {
    return (
      <AuthLayout variant="centered" title="Verify your email" description="We sent a verification link to your email address.">
        <div className="flex flex-col items-center justify-center gap-6 py-6 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 animate-pulse">
            <Inbox className="h-8 w-8 text-primary" aria-hidden="true" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white">
              ✓
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-text">Verify {email}</p>
            <p className="text-xs text-text2 max-w-sm">
              Please check your inbox and click the verification link to complete your registration.
            </p>
          </div>

          <div className="w-full pt-2">
            <EnhancedButton
              type="button"
              onClick={handleResendVerification}
              disabled={resendStatus === 'sending' || resendCountdown > 0}
              className="w-full h-11 text-xs font-semibold tracking-wide"
              variant="secondary"
            >
              {resendStatus === 'sending'
                ? 'Sending link...'
                : resendStatus === 'sent'
                ? `Resend link in ${resendCountdown}s`
                : 'Resend Verification Email'}
            </EnhancedButton>
          </div>

          <p className="text-xs text-muted">
            <Link to="/login" className="font-semibold text-primary hover:text-primary-strong transition-colors">
              Back to Sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="centered" title="Create your account" description="Start managing property in minutes.">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <EnhancedInput
            label="First name"
            placeholder="Alex"
            leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            onBlur={() => handleBlur('firstName')}
            error={getErrorToShow('firstName')}
            autoComplete="given-name"
            required
            focusColor="primary"
          />
          <EnhancedInput
            label="Last name"
            placeholder="Morgan"
            leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            onBlur={() => handleBlur('lastName')}
            error={getErrorToShow('lastName')}
            autoComplete="family-name"
            required
            focusColor="primary"
          />
        </div>
        
        <EnhancedInput
          type="email"
          label="Email address"
          placeholder="you@propertypro.app"
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
          placeholder="At least 8 characters"
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
          autoComplete="new-password"
          required
          focusColor="primary"
        />
        
        <PasswordStrength value={password} />
        
        <RoleSelector value={role} onChange={setRole} error={fieldErrors.role} />
        
        <div className="flex flex-col gap-1.5 mt-1 select-none">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-text group">
            <input 
              type="checkbox" 
              checked={termsAccepted} 
              onChange={(e) => setTermsAccepted(e.target.checked)} 
              onBlur={() => handleBlur('terms')}
              className="mt-0.5 h-4.5 w-4.5 rounded border-border/40 bg-black/30 text-primary focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer accent-primary"
            />
            <span className="text-text2 group-hover:text-text transition-colors duration-200 leading-normal">
              I agree to the{' '}
              <Link to="/terms" className="font-semibold text-primary hover:text-primary-strong transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="font-semibold text-primary hover:text-primary-strong transition-colors">Privacy Policy</Link>
            </span>
          </label>
          {getErrorToShow('terms') ? (
            <p className="text-[11px] text-danger font-medium animate-in fade-in-0 mt-0.5 pl-7">
              {fieldErrors.terms}
            </p>
          ) : null}
        </div>

        {apiError ? (
          <div className="rounded-lg border border-danger/30 bg-danger-soft/20 p-4 text-xs font-medium text-danger backdrop-blur-sm animate-in fade-in-50 duration-200" role="alert">
            {apiError}
          </div>
        ) : null}
        
        <EnhancedButton
          type="submit"
          size="lg"
          disabled={register.isPending}
          loading={register.isPending}
          className="w-full h-[54px] text-sm font-semibold tracking-wide hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg transition-all duration-200 mt-2"
          glowIntensity="high"
          shimmer={true}
        >
          {register.isPending ? 'Creating account…' : 'Create account'}
        </EnhancedButton>
      </form>
      
      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-strong">Sign in</Link>
      </p>
    </AuthLayout>
  )
}