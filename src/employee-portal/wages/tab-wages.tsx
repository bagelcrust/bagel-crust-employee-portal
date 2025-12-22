/**
 * Wages Tab - Bank-First View
 *
 * Uses wages_v2 table (clean, deduplicated bank checks)
 * Shows what actually left the bank account
 */

import { useState, useEffect } from 'react'
import { X, Banknote } from 'lucide-react'
import { supabase } from '../../shared/supabase-client'

interface CheckRecord {
  id: string
  payment_date: string
  amount: number
  check_number: string | null
  image_path: string | null
}

interface EmployeeSummary {
  employee_id: string
  employee_name: string
  total_paid: number
  check_count: number
  checks: CheckRecord[]
}

export function WagesTab() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null)
  const [checkImageUrls, setCheckImageUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    loadWages()
  }, [])


  async function loadWages() {
    setIsLoading(true)
    try {
      // Get wages from clean wages_v2 table (bank checks)
      const { data, error: queryError } = await supabase
        .schema('accounting')
        .from('wages_v2')
        .select(`
          id,
          employee_id,
          payment_date,
          amount,
          check_number
        `)
        .order('payment_date', { ascending: false })

      if (queryError) throw queryError

      // Get employee names
      const { data: empData, error: empError } = await supabase
        .schema('employees')
        .from('employees')
        .select('id, first_name, last_name')

      if (empError) throw empError

      const empNames: Record<string, string> = {}
      for (const e of empData || []) {
        empNames[e.id] = [e.first_name, e.last_name].filter(Boolean).join(' ')
      }

      // Get check image paths from accounting
      const { data: imageData } = await supabase
        .schema('accounting')
        .from('02_raw_transactions')
        .select('check_num, check_image_path')
        .not('check_image_path', 'is', null)

      const imagePaths: Record<string, string> = {}
      for (const row of imageData || []) {
        if (row.check_num) imagePaths[row.check_num] = row.check_image_path
      }

      // Group by employee
      const byEmployee: Record<string, { name: string; checks: CheckRecord[] }> = {}

      for (const w of data || []) {
        const empId = w.employee_id
        if (!byEmployee[empId]) {
          byEmployee[empId] = {
            name: empNames[empId] || 'Unknown',
            checks: []
          }
        }
        byEmployee[empId].checks.push({
          id: w.id,
          payment_date: w.payment_date,
          amount: parseFloat(w.amount) || 0,
          check_number: w.check_number,
          image_path: w.check_number ? imagePaths[w.check_number] || null : null
        })
      }

      const summaries: EmployeeSummary[] = Object.entries(byEmployee).map(([empId, data]) => ({
        employee_id: empId,
        employee_name: data.name,
        total_paid: data.checks.reduce((sum, c) => sum + c.amount, 0),
        check_count: data.checks.length,
        checks: data.checks
      }))

      // Sort by total paid descending
      summaries.sort((a, b) => b.total_paid - a.total_paid)
      setEmployees(summaries)

      // Preload ALL check images in background (so they're ready when modal opens)
      const allChecksWithImages = summaries.flatMap(emp =>
        emp.checks.filter(c => c.image_path)
      )
      if (allChecksWithImages.length > 0) {
        const paths = allChecksWithImages.map(c => c.image_path!)
        const { data: urlData } = await supabase.storage
          .from('check-images')
          .createSignedUrls(paths, 3600)

        if (urlData) {
          const urls: Record<string, string> = {}
          allChecksWithImages.forEach((check, i) => {
            if (urlData[i]?.signedUrl) urls[check.id] = urlData[i].signedUrl
          })
          setCheckImageUrls(urls)
        }
      }

    } catch (err) {
      console.error('[WAGES] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const formatCurrencyDetail = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatDate = (s: string) => {
    const d = new Date(s + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const grandTotal = employees.reduce((sum, e) => sum + e.total_paid, 0)

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="text-center text-gray-500 py-8">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="text-center text-red-600 py-8">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="w-7 h-7 text-green-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
          Wages
        </h2>
      </div>

      {/* Main Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
        {/* Card Header with Total */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="text-xl font-bold text-gray-800">Bank Payments 2025</span>
          <div className="text-2xl font-bold text-green-700">${formatCurrency(grandTotal)}</div>
        </div>

        {/* Employee List */}
        <div className="divide-y divide-gray-100">
          {employees.map((emp) => (
            <button
              key={emp.employee_id}
              onClick={() => setSelectedEmployee(emp)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div>
                <div className="text-lg font-medium text-gray-800">{emp.employee_name}</div>
                <div className="text-base text-gray-500">{emp.check_count} checks</div>
              </div>
              <span className="text-xl font-bold text-gray-700">${formatCurrency(emp.total_paid)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedEmployee(null)}
          />

          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedEmployee.employee_name}</h3>
                <div className="text-lg text-gray-500">{selectedEmployee.check_count} checks</div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
              >
                <X size={28} />
              </button>
            </div>

            {/* Total */}
            <div className="px-5 py-4 bg-green-50 border-b border-green-100">
              <div className="text-lg text-green-700 font-medium">Total from Bank</div>
              <div className="text-3xl font-bold text-green-800">${formatCurrencyDetail(selectedEmployee.total_paid)}</div>
            </div>

            {/* Check List */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-3 text-base font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                Checks
              </div>
              {selectedEmployee.checks.map((check) => (
                <div key={check.id} className="border-b border-gray-100">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-lg font-medium text-gray-800">
                        {formatDate(check.payment_date)}
                      </div>
                      {check.check_number && (
                        <div className="text-base text-gray-500">
                          Check #{check.check_number}
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-semibold text-gray-800">
                      ${formatCurrencyDetail(check.amount)}
                    </div>
                  </div>
                  {checkImageUrls[check.id] && (
                    <div className="px-5 pb-4">
                      <img
                        src={checkImageUrls[check.id]}
                        alt={`Check #${check.check_number}`}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
