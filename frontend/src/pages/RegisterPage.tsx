import { useState, type FormEvent, useEffect } from 'react'
import { Lock, Mail, User, Eye, EyeOff, Clock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { RoleSelector } from '@/components/auth/RoleSelector'
import { useRegister } from '@/hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<string>('tenant')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isPendingApproval, setIsPendingApproval] = useState(false)

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const register = useRegister()

  // Live validation logic
  useEffect(() => {
    const errors: Record<string, string> = {}

    if (role === 'owner') {
      if (!username.trim()) {
        errors.username = 'Username is required.'
      }
    } else {
      if (!firstName.trim()) {
        errors.firstName = 'First name is required.'
      }
      if (!lastName.trim()) {
        errors.lastName = 'Last name is required.'
      }
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
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if (!termsAccepted) {
      errors.terms = 'You must accept the Terms of Service and Privacy Policy.'
    }

    setFieldErrors(errors)
  }, [role, username, firstName, lastName, email, password, termsAccepted])

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitted(true)
    setApiError(null)

    setTouched({
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      terms: true,
    })

    if (!termsAccepted) return
    if (role === 'owner' && fieldErrors.username) return
    if (role === 'tenant' && (fieldErrors.firstName || fieldErrors.lastName)) return
    if (fieldErrors.email || fieldErrors.password) return

    const payload =
      role === 'owner'
        ? { email, password, username, role }
        : { email, password, firstName, lastName, role }

    register.mutate(payload, {
      onSuccess: (data) => {
        if (data.pendingApproval || role === 'owner') {
          setIsPendingApproval(true)
        } else {
          navigate('/app')
        }
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (
          message.toLowerCase().includes('already exists') ||
          message.includes('409') ||
          message.toLowerCase().includes('duplicate')
        ) {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'An account with this email already exists.',
          }))
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

  if (isPendingApproval) {
    return (
      <AuthLayout
        variant="centered"
        title="Registration Submitted"
        description="Your House Owner request is pending approval."
      >
        <div className="flex flex-col items-center justify-center gap-6 py-6 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 animate-pulse">
            <Clock className="h-8 w-8 text-amber-500" aria-hidden="true" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              !
            </div>
          </div>

          <div className="flex flex-col gap-3.5 max-w-md">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-semibold text-amber-400 backdrop-blur-sm">
              Your owner account is currently pending Super Admin approval.
            </div>
            <p className="text-xs text-text2 leading-relaxed">
              We have received your House Owner registration for <strong className="text-text">{email}</strong>. Once approved by the Super Admin, you will be able to log in to access your Owner Dashboard.
            </p>
          </div>

          <div className="w-full pt-4">
            <Link to="/login">
              <EnhancedButton
                type="button"
                className="w-full h-11 text-xs font-semibold tracking-wide"
                variant="primary"
              >
                Back to Sign in
              </EnhancedButton>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      variant="centered"
      title="Create your account"
      description="Start managing property in minutes."
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <RoleSelector value={role} onChange={setRole} error={fieldErrors.role} />

        {role === 'owner' ? (
          /* House Owner Registration: Username, Email, Password ONLY */
          <EnhancedInput
            label="Username"
            placeholder="johndoe_owner"
            leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onBlur={() => handleBlur('username')}
            error={getErrorToShow('username')}
            autoComplete="username"
            required
            focusColor="primary"
          />
        ) : (
          /* Tenant Registration: First Name, Last Name */
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
        )}

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
              {showPassword
                ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                : <Eye className="h-4 w-4" aria-hidden="true" />}
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
              <Link
                to="/terms"
                className="font-semibold text-primary hover:text-primary-strong transition-colors"
              >
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link
                to="/privacy"
                className="font-semibold text-primary hover:text-primary-strong transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {getErrorToShow('terms') ? (
            <p className="text-[11px] text-danger font-medium animate-in fade-in-0 mt-0.5 pl-7">
              {fieldErrors.terms}
            </p>
          ) : null}
        </div>

        {apiError ? (
          <div
            className="rounded-lg border border-danger/30 bg-danger-soft/20 p-4 text-xs font-medium text-danger backdrop-blur-sm animate-in fade-in-50 duration-200"
            role="alert"
          >
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
          {register.isPending
            ? 'Submitting…'
            : role === 'owner'
            ? 'Submit Owner Request'
            : 'Create account'}
        </EnhancedButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary transition-colors hover:text-primary-strong"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}