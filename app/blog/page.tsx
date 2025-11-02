import Link from 'next/link'
import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LandingNav } from '@/components/landing/nav'
import { Calendar, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { getBlogPosts } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'Blog - Luno',
  description: 'Financial tips, product updates, and insights to help you manage money better',
}

export default async function BlogPage() {
  // Fetch blog posts (ready for Notion integration)
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandingNav />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground">
            Financial tips, product updates, and insights to help you manage money better
          </p>
        </div>

        {/* Blog Posts */}
        {posts.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-16">
            <p className="text-muted-foreground mb-4">No blog posts yet.</p>
            <p className="text-sm text-muted-foreground">
              Blog posts will appear here once connected to Notion or your content source.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {posts.map((post) => (
              <Card key={post.slug} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {post.publishedAt && format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button variant="link" className="p-0" asChild>
                    <Link href={`/blog/${post.slug}`}>
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

