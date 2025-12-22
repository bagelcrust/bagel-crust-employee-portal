import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/supabase-client'

/**
 * P&L Data Structure - Full detail with subcategories
 */
export interface FinanceData {
  revenueItems: LineItem[]
  totalRevenue: number
  cogsCategories: ExpenseCategory[]  // Now nested like expenses
  totalCogs: number
  grossProfit: number
  expenseCategories: ExpenseCategory[]
  totalExpenses: number
  netIncome: number
}

export interface LineItem {
  name: string
  amount: number
}

export interface Transaction {
  date: string
  description: string
  vendorName: string
  amount: number
  accountName: string
}

export interface ExpenseCategory {
  name: string
  total: number
  items: LineItem[]
}

/**
 * Fetch P&L data using server-side aggregation function
 * Supports both YYYY-MM (month) and YYYY (full year) formats
 */
export function useFinanceData(period: string) {
  return useQuery({
    queryKey: ['financeData', period],
    queryFn: async (): Promise<FinanceData> => {
      let startDate: string
      let endDate: string

      if (period.length === 4) {
        // Full year: "2025"
        startDate = `${period}-01-01`
        endDate = `${parseInt(period) + 1}-01-01`
      } else {
        // Month: "2025-11"
        const [year, monthNum] = period.split('-').map(Number)
        startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1
        const nextYear = monthNum === 12 ? year + 1 : year
        endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
      }

      console.log(`[FINANCE] Fetching P&L for ${startDate} to ${endDate}`)

      // Call server-side aggregation function
      const { data, error } = await supabase
        .schema('accounting')
        .rpc('get_pnl_summary', {
          start_date: startDate,
          end_date: endDate
        })

      if (error) {
        console.error('[FINANCE] Error fetching P&L:', error)
        throw error
      }

      const result = data as {
        revenueItems: LineItem[]
        totalRevenue: number
        cogsCategories: ExpenseCategory[]
        totalCogs: number
        expenseCategories: ExpenseCategory[]
        totalExpenses: number
      }

      const grossProfit = result.totalRevenue - result.totalCogs
      const netIncome = grossProfit - result.totalExpenses

      console.log('[FINANCE] Summary:', {
        totalRevenue: result.totalRevenue.toFixed(2),
        totalCogs: result.totalCogs.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        totalExpenses: result.totalExpenses.toFixed(2),
        netIncome: netIncome.toFixed(2)
      })

      return {
        ...result,
        grossProfit,
        netIncome
      }
    },
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Fetch individual transactions for a specific subcategory
 * For COGS vendor drilldown, pass key like "cogs-Food and Beverage-Sam's Club"
 */
export async function fetchTransactionsBySubcategory(
  period: string,
  key: string
): Promise<Transaction[]> {
  let startDate: string
  let endDate: string

  if (period.length === 4) {
    startDate = `${period}-01-01`
    endDate = `${parseInt(period) + 1}-01-01`
  } else {
    const [year, monthNum] = period.split('-').map(Number)
    startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const nextMonth = monthNum === 12 ? 1 : monthNum + 1
    const nextYear = monthNum === 12 ? year + 1 : year
    endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  }

  let query = supabase
    .schema('accounting')
    .from('07_transactions_final')
    .select('"Date", "Description", "Vendor Name", "Amount", "Account Name"')
    .gte('Date', startDate)
    .lt('Date', endDate)

  // Check if this is a COGS vendor drilldown (format: "cogs-Category-Vendor")
  if (key.startsWith('cogs-')) {
    const parts = key.substring(5).split('-')
    const vendor = parts.pop()!
    const subcategory = parts.join('-')

    if (vendor === 'Other') {
      // "Other" = all vendors outside top 7
      // Top 7 vendors (hardcoded for performance)
      const top7 = ['David Reid Inc', "Sam's Club", 'WS Lee', 'Syscoo', 'Brenntag', 'Walmart', 'Lewistown Paper']
      query = query
        .eq('Tax Subcategory', subcategory)
        .not('Vendor Name', 'in', `(${top7.map(v => `"${v}"`).join(',')})`)
    } else {
      query = query.eq('Tax Subcategory', subcategory).eq('Vendor Name', vendor)
    }
  } else {
    query = query.eq('Tax Subcategory', key)
  }

  const { data, error } = await query.order('Date', { ascending: false })

  if (error) {
    console.error('[FINANCE] Error fetching transactions:', error)
    throw error
  }

  return (data || []).map((t: Record<string, unknown>) => ({
    date: t['Date'] as string,
    description: t['Description'] as string,
    vendorName: t['Vendor Name'] as string,
    amount: Number(t['Amount']),
    accountName: t['Account Name'] as string
  }))
}
