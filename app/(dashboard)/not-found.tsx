import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

/**
 * 404 page for dashboard routes
 */
export default function NotFound() {
  return (
    <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

