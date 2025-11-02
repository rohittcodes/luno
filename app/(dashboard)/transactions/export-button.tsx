'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  startDate?: string
  endDate?: string
}

export function ExportButton({ startDate, endDate }: ExportButtonProps) {
  async function handleExport(format: 'csv' | 'json' = 'csv') {
    try {
      const params = new URLSearchParams({ format })
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const response = await fetch(`/api/export/transactions?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Transactions exported successfully')
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Transactions exported successfully')
      }
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export transactions')
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => handleExport('csv')}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={() => handleExport('json')}>
        <Download className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
    </div>
  )
}

