/**
 * Documents Tab - Accountant-Friendly Hierarchical Layout
 *
 * Groups documents by TYPE first, then by time period:
 * - Bank: By account → months
 * - Sales Tax: By month
 * - Federal: By form type (941) → quarters
 * - State: By form type (UC-2, EIT) → quarters
 * - W-2s/1099s: By year → individuals
 */

import { useState, useEffect } from 'react'
import { FileText, Eye, Building2, Receipt, FileCheck, Landmark, Users } from 'lucide-react'
import { supabase } from '../../shared/supabase-client'

// Types
interface BankStatement {
  fileName: string
  month: string      // "2025-01"
  monthDisplay: string  // "January"
  account: string    // "1468"
}

interface SalesTaxDoc {
  fileName: string
  month: string
  monthDisplay: string
}

interface TaxForm {
  fileName: string
  period: string
  periodDisplay: string
  formType: string
}

type Category = 'bank' | 'salesTax' | 'federal' | 'state' | 'w2' | '1099'

const TABS: { key: Category; label: string }[] = [
  { key: 'bank', label: 'Bank' },
  { key: 'salesTax', label: 'Sales Tax' },
  { key: 'federal', label: 'Federal' },
  { key: 'state', label: 'State' },
  { key: 'w2', label: 'W-2s' },
  { key: '1099', label: '1099s' },
]

const ACCOUNTS = [
  { id: '1468', name: 'BC Out', desc: 'Operating Account' },
  { id: '3234', name: 'Payroll & Tax', desc: 'Payroll Account' },
  { id: '4366', name: 'All-In', desc: 'Reserve Account' },
]

export function BankTab() {
  const [activeTab, setActiveTab] = useState<Category>('bank')
  const [bankStatements, setBankStatements] = useState<BankStatement[]>([])
  const [salesTaxDocs, setSalesTaxDocs] = useState<SalesTaxDoc[]>([])
  const [taxForms, setTaxForms] = useState<TaxForm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllDocuments()
  }, [])

  async function loadAllDocuments() {
    setIsLoading(true)
    await Promise.all([
      loadBankStatements(),
      loadSalesTaxDocs(),
      loadTaxForms()
    ])
    setIsLoading(false)
  }

  async function loadBankStatements() {
    try {
      const { data } = await supabase.storage.from('bank-statements').list('', { limit: 500 })
      const parsed: BankStatement[] = []

      for (const f of data || []) {
        if (!f.name.endsWith('.pdf')) continue
        const match = f.name.match(/^(\d{2})-(\d{2})_(\d{4})_BnkStmnt\.pdf$/)
        if (!match) continue

        const [, yy, mm, acct] = match
        const year = `20${yy}`
        const monthDate = new Date(`${year}-${mm}-15`)

        parsed.push({
          fileName: f.name,
          month: `${year}-${mm}`,
          monthDisplay: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          account: acct
        })
      }

      setBankStatements(parsed.sort((a, b) => b.month.localeCompare(a.month)))
    } catch (err) {
      console.error('[DOCS] Bank error:', err)
    }
  }

  async function loadSalesTaxDocs() {
    try {
      const { data } = await supabase.storage.from('sales-tax-receipts').list('', { limit: 100 })
      const parsed: SalesTaxDoc[] = []

      for (const f of data || []) {
        if (!f.name.endsWith('.pdf')) continue
        const match = f.name.match(/Sales-Tax-(\d{4})-(\d{2})\.pdf/)
        if (!match) continue

        const [, year, mm] = match
        const monthDate = new Date(`${year}-${mm}-15`)

        parsed.push({
          fileName: f.name,
          month: `${year}-${mm}`,
          monthDisplay: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        })
      }

      setSalesTaxDocs(parsed.sort((a, b) => b.month.localeCompare(a.month)))
    } catch (err) {
      console.error('[DOCS] Sales tax error:', err)
    }
  }

  async function loadTaxForms() {
    try {
      // Load from payroll-tax-forms bucket (941, UC-2, EIT, W-2, 1099, etc.)
      const { data } = await supabase.storage.from('payroll-tax-forms').list('', { limit: 100 })
      const parsed: TaxForm[] = []

      for (const f of data || []) {
        if (!f.name.endsWith('.pdf')) continue
        const name = f.name.replace('.pdf', '')
        const parts = name.split('_')

        parsed.push({
          fileName: f.name,
          period: parts[0] || '',
          periodDisplay: parts[0] || name,
          formType: parts[1] || 'Other'
        })
      }

      setTaxForms(parsed)
    } catch (err) {
      console.error('[DOCS] Tax forms error:', err)
    }
  }

  async function viewDocument(bucket: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(fileName, 3600)
      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('[DOCS] View error:', err)
    }
  }

  // Render helpers
  function renderBankTab() {
    return (
      <div className="space-y-6">
        {ACCOUNTS.map(account => {
          const statements = bankStatements.filter(s => s.account === account.id)
          return (
            <div key={account.id}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-800">{account.name}</div>
                  <div className="text-[13px] text-gray-500">Account ending in {account.id}</div>
                </div>
              </div>
              {statements.length === 0 ? (
                <div className="text-gray-400 text-sm pl-7">No statements</div>
              ) : (
                <div className="space-y-1 pl-7">
                  {statements.map(s => (
                    <button
                      key={s.fileName}
                      onClick={() => viewDocument('bank-statements', s.fileName)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <span className="text-gray-700">{s.monthDisplay}</span>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderSalesTaxTab() {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-semibold text-gray-800">PA Sales Tax Returns</div>
            <div className="text-[13px] text-gray-500">Monthly filings</div>
          </div>
        </div>
        {salesTaxDocs.length === 0 ? (
          <div className="text-gray-400 text-sm pl-7">No sales tax documents</div>
        ) : (
          <div className="space-y-1 pl-7">
            {salesTaxDocs.map(doc => (
              <button
                key={doc.fileName}
                onClick={() => viewDocument('sales-tax-receipts', doc.fileName)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-gray-700">{doc.monthDisplay}</span>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderFederalTab() {
    const form941s = taxForms.filter(f => f.formType === '941' || f.formType.includes('941'))

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-semibold text-gray-800">Form 941</div>
            <div className="text-[13px] text-gray-500">Employer's Quarterly Federal Tax Return</div>
          </div>
        </div>
        {form941s.length === 0 ? (
          <div className="text-gray-400 text-sm pl-7">No 941 forms uploaded yet</div>
        ) : (
          <div className="space-y-1 pl-7">
            {form941s.map(form => (
              <button
                key={form.fileName}
                onClick={() => viewDocument('payroll-tax-forms', form.fileName)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-gray-700">{form.periodDisplay}</span>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderStateTab() {
    // Group forms by type
    const uc2Forms = taxForms.filter(f => f.formType.toLowerCase().includes('uc'))
    const eitForms = taxForms.filter(f => f.formType.toLowerCase().includes('eit'))
    const paW3Forms = taxForms.filter(f => f.formType.toLowerCase().includes('pa-w3') || f.formType.toLowerCase() === 'pa w3')
    const phlWageForms = taxForms.filter(f => f.formType.toLowerCase().includes('phl'))

    // Helper to render a section
    const renderSection = (title: string, subtitle: string, forms: TaxForm[]) => (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-5 h-5 text-purple-600" />
          <div>
            <div className="font-semibold text-gray-800">{title}</div>
            <div className="text-[13px] text-gray-500">{subtitle}</div>
          </div>
        </div>
        {forms.length === 0 ? (
          <div className="text-gray-400 text-sm pl-7">No forms uploaded yet</div>
        ) : (
          <div className="space-y-1 pl-7">
            {forms.map(form => (
              <button
                key={form.fileName}
                onClick={() => viewDocument('payroll-tax-forms', form.fileName)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-gray-700">{form.periodDisplay}</span>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    )

    return (
      <div className="space-y-6">
        {renderSection('UC-2', 'PA Unemployment Compensation', uc2Forms)}
        {renderSection('PA-W3', 'PA Employer Withholding', paW3Forms)}
        {renderSection('Local EIT', 'Earned Income Tax', eitForms)}
        {renderSection('PHL Wage Tax', 'Philadelphia City Wage Tax', phlWageForms)}
      </div>
    )
  }

  function renderW2Tab() {
    const w2Forms = taxForms.filter(f => f.formType.toLowerCase().includes('w-2') || f.formType.toLowerCase().includes('w2'))

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-orange-600" />
          <div>
            <div className="font-semibold text-gray-800">W-2 Forms</div>
            <div className="text-[13px] text-gray-500">Wage and Tax Statements</div>
          </div>
        </div>
        {w2Forms.length === 0 ? (
          <div className="text-gray-400 text-sm pl-7">No W-2 forms uploaded yet</div>
        ) : (
          <div className="space-y-1 pl-7">
            {w2Forms.map(form => (
              <button
                key={form.fileName}
                onClick={() => viewDocument('payroll-tax-forms', form.fileName)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-gray-700">{form.periodDisplay}</span>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function render1099Tab() {
    const form1099s = taxForms.filter(f => f.formType.includes('1099'))

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-red-600" />
          <div>
            <div className="font-semibold text-gray-800">1099 Forms</div>
            <div className="text-[13px] text-gray-500">Miscellaneous Income</div>
          </div>
        </div>
        {form1099s.length === 0 ? (
          <div className="text-gray-400 text-sm pl-7">No 1099 forms uploaded yet</div>
        ) : (
          <div className="space-y-1 pl-7">
            {form1099s.map(form => (
              <button
                key={form.fileName}
                onClick={() => viewDocument('payroll-tax-forms', form.fileName)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-gray-700">{form.periodDisplay}</span>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'bank': return renderBankTab()
      case 'salesTax': return renderSalesTaxTab()
      case 'federal': return renderFederalTab()
      case 'state': return renderStateTab()
      case 'w2': return renderW2Tab()
      case '1099': return render1099Tab()
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-12">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-7 h-7 text-blue-600" />
        <h1 className="text-[28px] font-bold text-gray-800 tracking-tight">Documents</h1>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        {renderActiveTab()}
      </div>
    </div>
  )
}
