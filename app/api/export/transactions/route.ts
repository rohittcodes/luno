import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

/**
 * Export transactions as CSV
 * GET /api/export/transactions?format=csv
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Fetch transactions
    let query = supabase
      .from('transactions')
      .select('*, accounts(*), categories(*)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data: transactions, error } = await query

    if (error) {
      throw error
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Date',
        'Description',
        'Type',
        'Amount',
        'Currency',
        'Account',
        'Category',
        'Payment Method',
        'Notes',
      ]

      const csvRows = (transactions || []).map((t: Transaction & { accounts?: any; categories?: any }) => {
        return [
          t.transaction_date,
          t.description || '',
          t.type,
          t.amount?.toString() || '0',
          t.currency || 'INR',
          t.accounts?.name || '',
          t.categories?.name || '',
          t.payment_method || '',
          t.notes || '',
        ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
      })

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      transactions: transactions || [],
      exported_at: new Date().toISOString(),
      count: (transactions || []).length,
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export transactions' },
      { status: 500 }
    )
  }
}

