import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LandingNav } from '@/components/landing/nav'
import { 
  Wallet, 
  Target, 
  Bell, 
  Shield, 
  Users, 
  BarChart3,
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react'

/**
 * Root Page (/)
 * Shows landing page if not authenticated
 * Redirects to dashboard if authenticated
 */
export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Otherwise show landing page
  return <LandingPage />
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 text-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Take control of your finances</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Manage Your Money
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Like a Pro
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track expenses, set budgets, analyze spending, and achieve your financial goals. 
            All in one beautiful, secure platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link href="/blog">Read Blog</Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Free Forever Plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Bank-Level Security</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you take control of your financial future
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Wallet className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Track Everything</CardTitle>
              <CardDescription>
                Record income, expenses, and transfers across multiple accounts
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Visualize spending patterns, trends, and category breakdowns
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Smart Budgets</CardTitle>
              <CardDescription>
                Set spending limits and get alerts when approaching budgets
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Bell className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Bill Reminders</CardTitle>
              <CardDescription>
                Never miss a payment with automated reminders for bills and subscriptions
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Family Sharing</CardTitle>
              <CardDescription>
                Collaborate with household members and share financial goals
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Bank-level encryption and complete control over your data
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">50 transactions/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">10 categories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">1 bank connection</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Basic analytics</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Pro Plan */}
          <Card className="border-primary border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pro</CardTitle>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Popular</span>
              </div>
              <CardDescription>For serious money managers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Unlimited transactions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Unlimited categories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">5 bank connections</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Receipt scanning</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/signup">Start Pro Trial</Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Family Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
              <CardDescription>For households</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Up to 5 family members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Shared budgets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Collaborative goals</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/signup">Start Family Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of users managing their finances with Luno
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Luno. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
