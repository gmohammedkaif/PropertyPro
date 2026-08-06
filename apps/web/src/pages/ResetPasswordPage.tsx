import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { useResetPassword } from '@/hooks/useAuth'
import { resetPasswordSchema } from '@/lib/authValidators'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const resetPassword = useResetPassword()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setApiError(null)

    const parsed = resetPasswordSchema.safeParse({ token, password })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    resetPassword.mutate(parsed.data, {
      onSuccess: () => {
        setSuccess(true)
      },
      onError: () => {
        setApiError('Invalid or expired reset link.')
      },
    })
  }

  if (success) {
    return (
      <AuthLayout variant="centered" title="Password reset" description="Your password has been updated.">
        <div className="text-center">
          <p className="text-sm text-text">Your password has been reset successfully.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-primary transition-colors hover:text-primary-strong">
            Sign in with new password
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="centered" title="Reset password" description="Enter your new password below.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="password"
          label="New password"
          placeholder="At least 8 characters"
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="new-password"
          required
        />
        <PasswordStrength value={password} />
        {apiError ? (
          <div className="rounded-lg border border-danger/40 bg-danger-soft/50 p-3 text-sm text-danger" role="alert">
            {apiError}
          </div>
        ) : null}
        <Button type="submit" size="lg" loading={resetPassword.isPending} className="w-full">
          {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-muted">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-strong">Sign in</Link>
      </p>
    </AuthLayout>
  )
}