import 'server-only'

/**
 * Blog Posts Data Layer
 * 
 * Currently returns placeholder data.
 * Ready for integration with:
 * - Notion API
 * - CMS (Contentful, Sanity, etc.)
 * - Markdown files
 * - Database
 */

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: string | null
  author?: string
  tags?: string[]
}

/**
 * Get all blog posts
 * Ready for Notion integration
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  // TODO: Replace with Notion API or other CMS
  // Example Notion integration:
  // const notion = new Client({ auth: process.env.NOTION_API_KEY })
  // const databaseId = process.env.NOTION_BLOG_DATABASE_ID
  // const response = await notion.databases.query({ database_id: databaseId })
  // return transformNotionPages(response.results)

  // Placeholder data for now
  return [
    // Add placeholder posts or return empty array
    // {
    //   slug: 'getting-started-with-luno',
    //   title: 'Getting Started with Luno',
    //   excerpt: 'Learn how to take control of your finances with Luno',
    //   content: '<p>Content here...</p>',
    //   publishedAt: new Date().toISOString(),
    // },
  ]
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts()
  return posts.find((post) => post.slug === slug) || null
}

/**
 * Example: Notion Integration Helper
 * Uncomment and configure when ready
 */
/*
import { Client } from '@notionhq/client'

export async function getBlogPostsFromNotion(): Promise<BlogPost[]> {
  const notion = new Client({ auth: process.env.NOTION_API_KEY })
  const databaseId = process.env.NOTION_BLOG_DATABASE_ID!

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Published',
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: 'Published Date',
        direction: 'descending',
      },
    ],
  })

  return response.results.map((page: any) => ({
    slug: page.properties.Slug.rich_text[0]?.plain_text || '',
    title: page.properties.Title.title[0]?.plain_text || '',
    excerpt: page.properties.Excerpt.rich_text[0]?.plain_text || '',
    content: await convertNotionToHTML(page.id, notion),
    publishedAt: page.properties['Published Date']?.date?.start || null,
    author: page.properties.Author?.people[0]?.name,
    tags: page.properties.Tags?.multi_select?.map((tag: any) => tag.name) || [],
  }))
}

async function convertNotionToHTML(pageId: string, notion: Client): Promise<string> {
  // Use @notionhq/client to fetch page content
  // Convert Notion blocks to HTML
  // Return HTML string
  return '<p>Content from Notion...</p>'
}
*/

