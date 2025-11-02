'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

function VerifyStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function checkVerification() {
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      const emailParam = searchParams.get('email')

      if (emailParam) {
        setEmail(emailParam)
      }

      // If no code, check if user is already verified
      if (!code) {
        const supabase = createClientBrowser()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.email_confirmed_at) {
          setStatus('success')
          return
        }

        setStatus('error')
        setErrorMessage('No verification code provided')
        return
      }

      try {
        const supabase = createClientBrowser()
        
        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          // Check for specific error types
          if (error.message.includes('expired') || error.message.includes('Invalid')) {
            setStatus('expired')
            setErrorMessage('This verification link has expired. Please request a new one.')
          } else {
            setStatus('error')
            setErrorMessage(error.message || 'Verification failed. Please try again.')
          }
          return
        }

        if (data?.user) {
          // Check if email is confirmed
          if (data.user.email_confirmed_at) {
            setStatus('success')
            setEmail(data.user.email || emailParam)
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          } else {
            setStatus('error')
            setErrorMessage('Email verification failed. Please try again.')
          }
        }
      } catch (err) {
        setStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    }

    checkVerification()
  }, [searchParams, router])

  const handleResendEmail = async () => {
    if (!email) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        setErrorMessage('Failed to resend email. Please try again.')
        return
      }

      setErrorMessage(null)
      alert('Verification email sent! Check your inbox.')
    } catch (err) {
      setErrorMessage('Failed to resend email. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <CardTitle>Verifying your email...</CardTitle>
              <CardDescription>Please wait while we confirm your email address</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. Redirecting to dashboard...
              </CardDescription>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <XCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle>Verification Link Expired</CardTitle>
              <CardDescription>
                This verification link has expired. Please request a new one.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>
                {errorMessage || 'We couldn\'t verify your email. Please try again.'}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && status !== 'loading' && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {email && (status === 'expired' || status === 'error') && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>We can send a new verification email to:</p>
                  <p className="font-medium">{email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendEmail}
                    className="mt-2"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {status === 'success' && (
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}

            {(status === 'expired' || status === 'error') && (
              <>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/login">Back to Login</Link>
                </Button>
                <Button asChild className="w-full" variant="ghost">
                  <Link href="/signup">Sign Up Again</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyStatusContent />
    </Suspense>
  )
}

