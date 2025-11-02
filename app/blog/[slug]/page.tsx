import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LandingNav } from '@/components/landing/nav'
import { Calendar, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { getBlogPosts, getBlogPost } from '@/lib/blog/posts'

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found - Luno Blog',
    }
  }

  return {
    title: `${post.title} - Luno Blog`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandingNav />
      
      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" className="mb-8" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          {/* Post Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              {post.publishedAt && format(new Date(post.publishedAt), 'MMMM dd, yyyy')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            )}
          </header>

          {/* Post Content */}
          <Card>
            <CardContent className="pt-8 prose prose-lg dark:prose-invert max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
            </CardContent>
          </Card>

          {/* Back to Blog */}
          <div className="mt-12">
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}

