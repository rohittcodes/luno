'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link')
      return
    }

    acceptInvitation()
  }, [token])

  async function acceptInvitation() {
    try {
      const response = await fetch('/api/households/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setStatus('success')
      setMessage(data.message || 'Successfully joined household')
      toast.success('Successfully joined household!')

      // Redirect to family page after 2 seconds
      setTimeout(() => {
        router.push('/family')
      }, 2000)
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to accept invitation')
      toast.error(error.message || 'Failed to accept invitation')
    }
  }

  return (
    <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            Accept Invitation
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your invitation...'}
            {status === 'success' && 'You\'ve successfully joined the household!'}
            {status === 'error' && 'Unable to accept this invitation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-center text-green-600">{message}</p>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting you to the family page...
              </p>
              <Button
                onClick={() => router.push('/family')}
                className="w-full"
              >
                Go to Family Page
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-center text-red-600">{message}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/family')}
                  className="flex-1"
                >
                  View Family
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

