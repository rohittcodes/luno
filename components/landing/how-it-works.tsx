import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Target, TrendingUp } from 'lucide-react'

export function HowItWorks() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
      <div className="text-center mb-20">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-4">
          How it works
        </p>
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
          How Luno Works
        </h2>
        <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Get started with financial freedom in three simple steps
        </p>
      </div>

      {/* Divider line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-20" />

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Card 1 */}
        <Card className="relative rounded-[2rem] border-2 hover:border-primary/50 transition-all duration-300 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="p-8 relative z-10">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-6xl font-bold text-primary/30">01</span>
            </div>
            <CardTitle className="text-2xl font-bold mb-3">Connect Your Accounts</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Securely link your bank accounts and credit cards. We use bank-level encryption to keep your data safe.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card 2 */}
        <Card className="relative rounded-[2rem] border-2 hover:border-primary/50 transition-all duration-300 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="p-8 relative z-10">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <Target className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-6xl font-bold text-primary/30">02</span>
            </div>
            <CardTitle className="text-2xl font-bold mb-3">Track & Categorize</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Automatically categorize transactions and set up budgets. Get real-time insights into your spending.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card 3 */}
        <Card className="relative rounded-[2rem] border-2 hover:border-primary/50 transition-all duration-300 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="p-8 relative z-10">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-6xl font-bold text-primary/30">03</span>
            </div>
            <CardTitle className="text-2xl font-bold mb-3">Achieve Your Goals</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Set financial goals and watch your progress. Get personalized insights and recommendations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  )
}
