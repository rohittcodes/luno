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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <LandingNav />

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border-2 border-primary/20 text-base font-semibold mb-12 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Take control of your finances</span>
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-10 leading-[0.95]">
              Manage Your Money
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Like a Pro
              </span>
            </h1>

            <p className="text-2xl sm:text-3xl text-muted-foreground mb-14 max-w-4xl mx-auto leading-relaxed font-medium">
              Track expenses, set budgets, analyze spending, and achieve your financial goals.
              All in one beautiful, secure platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
              <Button size="lg" asChild className="text-xl px-12 py-8 h-auto rounded-[3rem] font-bold shadow-2xl hover:shadow-3xl transition-all text-primary-foreground">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-xl px-12 py-8 h-auto rounded-[3rem] font-bold border-[3px]">
                <Link href="/blog">Read Blog</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-lg font-semibold">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-500 stroke-[3]" />
                </div>
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-500 stroke-[3]" />
                </div>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-500 stroke-[3]" />
                </div>
                <span>Bank-Level Security</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="text-center mb-24">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight">
            Everything You Need
          </h2>
          <p className="text-2xl sm:text-3xl text-muted-foreground max-w-4xl mx-auto font-medium">
            Powerful features to help you take control of your financial future
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
          <Card className="rounded-[2.5rem] border-[3px] hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group overflow-hidden">
            <CardHeader className="p-10">
              <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Track Everything</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Record income, expenses, and transfers across multiple accounts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group overflow-hidden">
            <CardHeader className="p-10">
              <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Analytics & Insights</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Visualize spending patterns, trends, and category breakdowns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group overflow-hidden">
            <CardHeader className="p-10">
              <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Smart Budgets</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Set spending limits and get alerts when approaching budgets
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group overflow-hidden">
            <CardHeader className="p-10">
              <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Bill Reminders</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Never miss a payment with automated reminders for bills and subscriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group overflow-hidden">
            <CardHeader className="p-10">
              <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Family Sharing</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Collaborate with household members and share financial goals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[2.5rem] border-[3px] hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group overflow-hidden">
            <CardHeader className="p-10">
              <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Secure & Private</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Bank-level encryption and complete control over your data
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              Simple Pricing
            </h2>
            <p className="text-2xl sm:text-3xl text-muted-foreground max-w-4xl mx-auto font-medium">
              Start free and upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
            {/* Free Plan */}
            <Card className="rounded-[3rem] border-[3px] hover:shadow-2xl transition-all duration-300">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="text-3xl font-bold">Free</CardTitle>
                <CardDescription className="text-base mt-2">Perfect for getting started</CardDescription>
                <div className="mt-8">
                  <span className="text-6xl font-extrabold tracking-tight">$0</span>
                  <span className="text-muted-foreground text-lg font-medium">/month</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">50 transactions/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">10 categories</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">1 bank connection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">Basic analytics</span>
                  </li>
                </ul>
                <Button className="w-full h-14 text-lg font-bold rounded-[2rem]" variant="outline" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="rounded-[3rem] border-primary border-[4px] shadow-xl relative overflow-hidden scale-105 hover:scale-110 transition-all duration-300">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
              <CardHeader className="p-8 pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold">Pro</CardTitle>
                  <span className="text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-full font-bold border border-primary/30">
                    Popular
                  </span>
                </div>
                <CardDescription className="text-base mt-2">For serious money managers</CardDescription>
                <div className="mt-8">
                  <span className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    $9
                  </span>
                  <span className="text-muted-foreground text-lg font-medium">/month</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base font-medium">Unlimited transactions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base font-medium">Unlimited categories</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base font-medium">5 bank connections</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base font-medium">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base font-medium">Receipt scanning</span>
                  </li>
                </ul>
                <Button className="w-full h-14 text-lg font-bold rounded-[2rem] shadow-lg" asChild>
                  <Link href="/signup">Start Pro Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Family Plan */}
            <Card className="rounded-[3rem] border-[3px] hover:shadow-2xl transition-all duration-300">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="text-3xl font-bold">Family</CardTitle>
                <CardDescription className="text-base mt-2">For households</CardDescription>
                <div className="mt-8">
                  <span className="text-6xl font-extrabold tracking-tight">$19</span>
                  <span className="text-muted-foreground text-lg font-medium">/month</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">Up to 5 family members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">Shared budgets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-500 stroke-[3]" />
                    </div>
                    <span className="text-base">Collaborative goals</span>
                  </li>
                </ul>
                <Button className="w-full h-14 text-lg font-bold rounded-[2rem]" variant="outline" asChild>
                  <Link href="/signup">Start Family Plan</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <Card className="max-w-6xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30 border-[3px] rounded-[4rem] shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
          <CardHeader className="text-center p-16 pb-10 relative z-10">
            <CardTitle className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              Ready to Get Started?
            </CardTitle>
            <CardDescription className="text-2xl sm:text-3xl font-medium max-w-3xl mx-auto">
              Join thousands of users managing their finances with Luno
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-6 p-16 pt-10 relative z-10">
            <Button size="lg" asChild className="text-xl px-12 py-8 h-auto rounded-[3rem] font-bold shadow-2xl hover:shadow-3xl transition-all">
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-xl px-12 py-8 h-auto rounded-[3rem] font-bold border-[3px]">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      
      {/* Footer */}
      <footer className="border-t-2 bg-gradient-to-b from-muted/30 to-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-5">Product</h3>
              <ul className="space-y-3.5 text-base text-muted-foreground">
                <li><Link href="/#features" className="hover:text-primary transition-colors font-medium">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-primary transition-colors font-medium">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors font-medium">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-5">Company</h3>
              <ul className="space-y-3.5 text-base text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors font-medium">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors font-medium">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-5">Resources</h3>
              <ul className="space-y-3.5 text-base text-muted-foreground">
                <li><Link href="/docs" className="hover:text-primary transition-colors font-medium">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-primary transition-colors font-medium">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-5">Legal</h3>
              <ul className="space-y-3.5 text-base text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors font-medium">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors font-medium">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t-2 text-center">
            <p className="text-base text-muted-foreground font-medium">
              © {new Date().getFullYear()} Luno. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
