import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useForgotPassword } from '@/hooks/useAuth'
import { forgotPasswordSchema } from '@/lib/authValidators'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const forgotPassword = useForgotPassword()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setApiError(null)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    forgotPassword.mutate(parsed.data, {
      onSuccess: (data) => {
        setSuccess(true)
        if (data.meta?.resetToken) {
          setResetToken(data.meta.resetToken as string)
        }
      },
      onError: () => {
        setApiError('Something went wrong. Please try again.')
      },
    })
  }

  if (success) {
    return (
      <AuthLayout variant="centered" title="Check your email" description="We sent a password reset link if an account exists.">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Mail className="h-8 w-8" aria-hidden="true" />
            </div>
          </div>
          <p className="text-sm text-text">If an account with that email exists, a reset link has been sent.</p>
          {resetToken ? (
            <p className="mt-3 text-xs text-muted">Dev reset token: <code className="rounded bg-surface px-1.5 py-0.5 font-mono">{resetToken}</code></p>
          ) : null}
          <EnhancedButton
            variant="primary"
            size="md"
            className="mt-6 w-full"
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
        
        {apiError ? (
          <div className="rounded-lg border border-danger/40 bg-danger-soft/30 p-4 text-sm text-danger backdrop-blur-sm" role="alert">
            {apiError}
          </div>
        ) : null}
        
        <EnhancedButton
          type="submit"
          size="lg"
          loading={forgotPassword.isPending}
          className="w-full font-medium"
          glowIntensity="high"
          shimmer={true}
        >
          {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
        </EnhancedButton>
      </form>
      
      <p className="mt-6 text-center text-sm text-muted">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-strong">Sign in</Link>
      </p>
    </AuthLayout>
  )
}