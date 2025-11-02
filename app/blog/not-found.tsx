import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LandingNav } from '@/components/landing/nav'
import { ArrowLeft } from 'lucide-react'

export default function BlogNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandingNav />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

