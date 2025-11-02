import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Handle password reset flow
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password?code=${code}`)
      }

      // Handle email verification
      if (type === 'signup' || type === 'email_change') {
        // Redirect to verification status page
        const verifyUrl = new URL('/auth/verify', origin)
        verifyUrl.searchParams.set('code', code)
        verifyUrl.searchParams.set('type', type || 'signup')
        if (data.user.email) {
          verifyUrl.searchParams.set('email', data.user.email)
        }
        return NextResponse.redirect(verifyUrl.toString())
      }
      
      // For other flows (like magic link), redirect normally
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    // If there's an error, redirect to verification status page with error
    if (error) {
      const verifyUrl = new URL('/auth/verify', origin)
      verifyUrl.searchParams.set('code', code)
      if (type) {
        verifyUrl.searchParams.set('type', type)
      }
      return NextResponse.redirect(verifyUrl.toString())
    }
  }

  // No code provided or other error - redirect to verification page
  const verifyUrl = new URL('/auth/verify', origin)
  return NextResponse.redirect(verifyUrl.toString())
}

