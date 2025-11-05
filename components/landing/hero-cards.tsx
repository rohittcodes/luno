'use client'

import { Card } from '@/components/ui/card'
import { CreditCard, TrendingUp, Wallet } from 'lucide-react'
import { useState, type ComponentType } from 'react'

type TrendDetail = { type: 'trend'; text: string }
type ProgressDetail = { type: 'progress'; spent: number; total: number }
type MembersDetail = { type: 'members'; avatars: string[] }
type CardDetail = TrendDetail | ProgressDetail | MembersDetail

type CardItem = {
  id: number
  title: string
  value: string
  subtitle?: string
  icon: ComponentType<any> | null
  detail: CardDetail
  gradient: string
}

const cards: CardItem[] = [
  {
    id: 1,
    title: 'Monthly Budget',
    value: '$3,200',
    icon: CreditCard,
    detail: { type: 'progress', spent: 2100, total: 3200 },
    gradient: 'from-primary to-primary/80'
  },
  {
    id: 2,
    title: 'Active Goals',
    value: '3',
    subtitle: 'On track to save $15,000',
    icon: null,
    detail: { type: 'members', avatars: ['V', 'H', 'E'] },
    gradient: 'from-primary/80 to-primary/60'
  },
  {
    id: 3,
    title: 'Total Balance',
    value: '$12,450',
    icon: Wallet,
    detail: { type: 'trend', text: '+12.5% this month' },
    gradient: 'from-primary/90 to-primary'
  },
]

export function HeroCards() {
  const [cardOrder] = useState([0, 1, 2])

  const getCardClasses = (index: number) => {
    const orderIndex = cardOrder.indexOf(index)
    if (orderIndex === 2) return 'z-30 opacity-100 scale-100 translate-y-0'
    if (orderIndex === 1) return 'z-20 opacity-85 scale-95 translate-y-6'
    if (orderIndex === 0) return 'z-10 opacity-70 scale-90 translate-y-12'
    return ''
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[350px] sm:h-[380px]">
      {cards.map((card, index) => {
        const Icon = card.icon
        const orderIndex = cardOrder.indexOf(index)
        return (
          <div
            key={card.id}
            className={`absolute inset-x-0 mx-auto w-full transition-all duration-300 ease-out ${getCardClasses(index)} ${orderIndex === 2 ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            <Card className="relative w-full h-[280px] sm:h-[300px] rounded-[2rem] border-2 shadow-2xl overflow-hidden bg-card">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90`} />

              <div className="p-8 relative z-10 h-full flex flex-col justify-between text-primary-foreground">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-2">{card.title}</p>
                    <p className="text-5xl font-bold mb-1">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-sm opacity-80">{card.subtitle}</p>
                    )}
                  </div>
                  {Icon && (
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                  )}
                </div>

                {/* Card Details */}
                {card.detail.type === 'trend' && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{card.detail.text}</span>
                  </div>
                )}

                {card.detail.type === 'progress' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">Spent</span>
                      <span className="font-semibold">${card.detail.spent.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-[66%]" />
                    </div>
                  </div>
                )}

                {card.detail.type === 'members' && (
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {card.detail.avatars.map((avatar: string, idx: number) => (
                        <div
                          key={idx}
                          className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm border-2 border-primary flex items-center justify-center text-sm font-bold"
                        >
                          {avatar}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm opacity-90">Family members</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )
      })}

      {/* Swipe Hint */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center text-sm text-muted-foreground">
        Swipe to explore
      </div>
    </div>
  )
}
