import { useState, type FormEvent, useEffect } from 'react'
import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useForgotPassword } from '@/hooks/useAuth'
import { forgotPasswordSchema } from '@/lib/authValidators'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const forgotPassword = useForgotPassword()

  // Live validation
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
    setFieldErrors(errors)
  }, [email])

  const handleBlur = () => {
    setTouched({ email: true })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitted(true)
    setApiError(null)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      return
    }

    forgotPassword.mutate(parsed.data, {
      onSuccess: (data) => {
        setSuccess(true)
        if (data.meta?.resetToken) {
          setResetToken(data.meta.resetToken as string)
        }
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        if (message.includes('404') || message.toLowerCase().includes('not found') || message.toLowerCase().includes('no user')) {
          setApiError('No account found with this email address.')
        } else {
          setApiError('Something went wrong. Please try again.')
        }
      },
    })
  }

  const getErrorToShow = () => {
    if (!isSubmitted && !touched.email) return undefined
    return fieldErrors.email
  }

  if (success) {
    return (
      <AuthLayout variant="centered" title="Check your email" description="We sent a password reset link if an account exists.">
        <div className="text-center flex flex-col items-center justify-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Mail className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-sm text-text">If an account with that email exists, a reset link has been sent.</p>
          {resetToken ? (
            <p className="text-xs text-muted">Dev reset token: <code className="rounded bg-surface px-1.5 py-0.5 font-mono">{resetToken}</code></p>
          ) : null}
          <EnhancedButton
            variant="secondary"
            size="md"
            className="w-full h-11 text-xs font-semibold tracking-wide"
            onClick={() => window.location.href = '/login'}
          >
            Back to sign in
          </EnhancedButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="centered" title="Forgot password" description="Enter your email and we'll send you a reset link.">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <EnhancedInput
          type="email"
          label="Email address"
          placeholder="you@propertypro.app"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={handleBlur}
          error={getErrorToShow()}
          autoComplete="email"
          required
          focusColor="primary"
        />
        
        {apiError ? (
          <div className="rounded-lg border border-danger/30 bg-danger-soft/20 p-4 text-xs font-medium text-danger backdrop-blur-sm animate-in fade-in-50 duration-200" role="alert">
            {apiError}
          </div>
        ) : null}
        
        <EnhancedButton
          type="submit"
          size="lg"
          disabled={forgotPassword.isPending}
          loading={forgotPassword.isPending}
          className="w-full h-[54px] text-sm font-semibold tracking-wide hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg transition-all duration-200 mt-2"
          glowIntensity="high"
          shimmer={true}
        >
          {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
        </EnhancedButton>
      </form>
      
      <p className="mt-6 text-center text-xs text-muted">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-strong">Sign in</Link>
      </p>
    </AuthLayout>
  )
}