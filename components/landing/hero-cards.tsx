'use client'

import { Card } from '@/components/ui/card'
import { CreditCard, TrendingUp, Wallet } from 'lucide-react'
import { useState, useRef, type ComponentType } from 'react'

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
  const [cardOrder, setCardOrder] = useState([0, 1, 2])
  const [draggedCard, setDraggedCard] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (index !== cardOrder[2]) return // Only allow dragging top card

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    dragStartPos.current = { x: clientX, y: clientY }
    setDraggedCard(index)
  }

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggedCard === null) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const deltaX = clientX - dragStartPos.current.x
    const deltaY = clientY - dragStartPos.current.y

    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (draggedCard === null) return

    const threshold = 100

    if (Math.abs(dragOffset.x) > threshold || Math.abs(dragOffset.y) > threshold) {
      // Card swiped - move to back
      setCardOrder(prev => {
        const newOrder = [...prev]
        const topCard = newOrder.pop()!
        newOrder.unshift(topCard)
        return newOrder
      })
    }

    setDraggedCard(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const getCardStyle = (index: number) => {
    const orderIndex = cardOrder.indexOf(index)
    const isTop = orderIndex === 2
    const isMiddle = orderIndex === 1
    const isBottom = orderIndex === 0

    if (isTop && draggedCard === index) {
      const rotation = dragOffset.x / 20
      return {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        zIndex: 30,
        opacity: 1,
        scale: 1,
        transition: 'none'
      }
    }

    if (isTop) {
      return { zIndex: 30, opacity: 1, scale: 1, y: 0 }
    }
    if (isMiddle) {
      return { zIndex: 20, opacity: 0.85, scale: 0.94, y: 24 }
    }
    if (isBottom) {
      return { zIndex: 10, opacity: 0.7, scale: 0.88, y: 48 }
    }
    return {}
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[350px] sm:h-[380px]">
      {cards.map((card, index) => {
        const style = getCardStyle(index)
        const Icon = card.icon
        const orderIndex = cardOrder.indexOf(index)

        return (
          <div
            key={card.id}
            className="absolute inset-x-0 mx-auto w-full cursor-grab active:cursor-grabbing"
            style={{
              zIndex: style.zIndex,
              opacity: style.opacity,
              transform: style.transform || `translateY(${style.y}px) scale(${style.scale})`,
              transition: style.transition || 'all 0.3s ease-out',
              pointerEvents: orderIndex === 2 ? 'auto' : 'none'
            }}
            onMouseDown={(e) => handleDragStart(e, index)}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e, index)}
            onTouchMove={handleDrag}
            onTouchEnd={handleDragEnd}
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
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${(card.detail.spent / card.detail.total) * 100}%` }}
                      />
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
