'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useState } from 'react'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Small Business Owner',
    content: 'Luno has transformed how I manage my business finances. The insights are invaluable and have helped me save thousands.',
    rating: 5,
    avatar: 'SJ'
  },
  {
    name: 'Michael Chen',
    role: 'Freelance Designer',
    content: 'The best financial tracking app I\'ve used. Clean interface, powerful features, and the family sharing is perfect for us.',
    rating: 5,
    avatar: 'MC'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Manager',
    content: 'Finally, a budgeting tool that actually works! The automated categorization saves me hours every month.',
    rating: 5,
    avatar: 'ER'
  }
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent -z-10" />

      <div className="text-center mb-20">
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
          What People Say
        </h2>
        <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Trusted by thousands of users worldwide
        </p>
      </div>

      {/* Desktop view - 3 cards */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-10 max-w-7xl mx-auto mb-12">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className="rounded-[2rem] border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
          >
            <CardContent className="p-8">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-lg leading-relaxed mb-8 text-foreground/90">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">{testimonial.avatar}</span>
                </div>
                <div>
                  <p className="font-bold text-base">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile/Tablet view - carousel */}
      <div className="lg:hidden max-w-2xl mx-auto">
        <Card className="rounded-[2rem] border-2">
          <CardContent className="p-8">
            {/* Rating */}
            <div className="flex gap-1 mb-6">
              {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>

            {/* Content */}
            <p className="text-lg leading-relaxed mb-8 text-foreground/90">
              "{testimonials[currentIndex].content}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">{testimonials[currentIndex].avatar}</span>
              </div>
              <div>
                <p className="font-bold text-base">{testimonials[currentIndex].name}</p>
                <p className="text-sm text-muted-foreground">{testimonials[currentIndex].role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            className="rounded-full w-12 h-12"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            className="rounded-full w-12 h-12"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
