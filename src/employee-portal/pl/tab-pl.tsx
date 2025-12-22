/**
 * P&L Tab - Mobile-optimized Profit & Loss
 *
 * Portal-style design matching other tabs:
 * - Glass card containers
 * - Big summary at top
 * - Collapsible sections for details
 */

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, FileText, Info, X } from 'lucide-react'
import { useFinanceData, fetchTransactionsBySubcategory, type Transaction } from './fetch-finance-data'
import { getCategoryInfo, type CategoryInfo } from './category-info'

export function PLTab() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025') // '2025' for full year, '2025-01' for month
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['revenue', 'cogs', 'expenses']))
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({})
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())
  const [infoModal, setInfoModal] = useState<CategoryInfo | null>(null)

  const dateRange = selectedPeriod

  // Clear when period changes
  useEffect(() => {
    setTransactions({})
    setExpandedItems(new Set())
  }, [dateRange])

  const { data, isLoading, error } = useFinanceData(dateRange)

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="text-center text-gray-500 text-base font-semibold py-8">
          Loading P&L...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="text-center text-red-600 py-8">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const {
    revenueItems = [],
    totalRevenue = 0,
    cogsCategories = [],
    totalCogs = 0,
    expenseCategories = [],
    totalExpenses = 0
  } = data || {}

  const formatCurrency = (amount: number) => {
    return Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const formatCurrencyDetail = (amount: number) => {
    return Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const toggleItem = async (subcategory: string) => {
    const isExpanded = expandedItems.has(subcategory)

    if (isExpanded) {
      const newExpanded = new Set(expandedItems)
      newExpanded.delete(subcategory)
      setExpandedItems(newExpanded)
    } else {
      const newExpanded = new Set(expandedItems)
      newExpanded.add(subcategory)
      setExpandedItems(newExpanded)

      if (!transactions[subcategory]) {
        setLoadingItems(prev => new Set(prev).add(subcategory))
        try {
          const txns = await fetchTransactionsBySubcategory(dateRange, subcategory)
          setTransactions(prev => ({ ...prev, [subcategory]: txns }))
        } catch (err) {
          console.error('Failed to fetch transactions:', err)
        } finally {
          setLoadingItems(prev => {
            const next = new Set(prev)
            next.delete(subcategory)
            return next
          })
        }
      }
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const showInfo = (categoryName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const info = getCategoryInfo(categoryName)
    if (info) setInfoModal(info)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-7 h-7 text-blue-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
          P&L
        </h2>
      </div>

      {/* Period Selector */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium text-base"
        >
          <option value="2025">Full Year 2025</option>
          {Array.from({ length: 12 }, (_, i) => {
            const monthNum = String(i + 1).padStart(2, '0')
            const label = new Date(`2025-${monthNum}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long' })
            return (
              <option key={monthNum} value={`2025-${monthNum}`}>
                {label} 2025
              </option>
            )
          })}
        </select>
      </div>

      {/* Revenue Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
        <button
          onClick={() => toggleSection('revenue')}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('revenue') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <span className="font-bold text-gray-800">Revenue</span>
            <button
              onClick={(e) => showInfo('Revenue', e)}
              className="p-1 rounded-full hover:bg-gray-100 text-blue-500"
            >
              <Info size={16} />
            </button>
          </div>
          <span className="font-bold text-green-700">${formatCurrency(totalRevenue)}</span>
        </button>

        {expandedSections.has('revenue') && (
          <div className="border-t border-gray-100">
            {revenueItems.map((item) => (
              <div key={item.name}>
                <button
                  onClick={() => toggleItem(item.name)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-50"
                >
                  <span className="text-gray-700 text-sm flex items-center gap-1">
                    {expandedItems.has(item.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {item.name}
                  </span>
                  <span className="text-gray-800 font-medium text-sm">${formatCurrencyDetail(item.amount)}</span>
                </button>
                {expandedItems.has(item.name) && (
                  <TransactionList
                    transactions={transactions[item.name]}
                    isLoading={loadingItems.has(item.name)}
                    formatDate={formatDate}
                    formatCurrency={formatCurrencyDetail}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COGS Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
        <button
          onClick={() => toggleSection('cogs')}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('cogs') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <span className="font-bold text-gray-800">Cost of Goods</span>
            <button
              onClick={(e) => showInfo('Cost of Goods', e)}
              className="p-1 rounded-full hover:bg-gray-100 text-blue-500"
            >
              <Info size={16} />
            </button>
          </div>
          <span className="font-bold text-orange-700">${formatCurrency(totalCogs)}</span>
        </button>

        {expandedSections.has('cogs') && (
          <div className="border-t border-gray-100">
            {cogsCategories.map((category) => (
              <div key={category.name} className="border-b border-gray-100 last:border-b-0">
                {/* Category header (e.g., Food and Beverage) */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 text-sm">{category.name}</span>
                    {getCategoryInfo(category.name) && (
                      <button
                        onClick={(e) => showInfo(category.name, e)}
                        className="p-0.5 rounded-full hover:bg-gray-200 text-blue-500"
                      >
                        <Info size={12} />
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">${formatCurrencyDetail(category.total)}</span>
                </div>
                {/* Vendors */}
                {category.items.map((item) => (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleItem(`cogs-${category.name}-${item.name}`)}
                      className="w-full flex items-center justify-between px-4 py-2 pl-6 text-left"
                    >
                      <span className="text-gray-600 text-xs flex items-center gap-1">
                        {expandedItems.has(`cogs-${category.name}-${item.name}`) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        {item.name}
                      </span>
                      <span className="text-gray-700 text-xs">${formatCurrencyDetail(item.amount)}</span>
                    </button>
                    {expandedItems.has(`cogs-${category.name}-${item.name}`) && (
                      <TransactionList
                        transactions={transactions[`cogs-${category.name}-${item.name}`]}
                        isLoading={loadingItems.has(`cogs-${category.name}-${item.name}`)}
                        formatDate={formatDate}
                        formatCurrency={formatCurrencyDetail}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
        <button
          onClick={() => toggleSection('expenses')}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('expenses') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <span className="font-bold text-gray-800">Expenses</span>
            <button
              onClick={(e) => showInfo('Expenses', e)}
              className="p-1 rounded-full hover:bg-gray-100 text-blue-500"
            >
              <Info size={16} />
            </button>
          </div>
          <span className="font-bold text-red-700">${formatCurrency(totalExpenses)}</span>
        </button>

        {expandedSections.has('expenses') && (
          <div className="border-t border-gray-100">
            {expenseCategories.map((category) => (
              <div key={category.name} className="border-b border-gray-100 last:border-b-0">
                {/* Category header */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 text-sm">{category.name}</span>
                    {getCategoryInfo(category.name) && (
                      <button
                        onClick={(e) => showInfo(category.name, e)}
                        className="p-0.5 rounded-full hover:bg-gray-200 text-blue-500"
                      >
                        <Info size={12} />
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">${formatCurrencyDetail(category.total)}</span>
                </div>
                {/* Subcategories */}
                {category.items.map((item) => (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleItem(item.name)}
                      className="w-full flex items-center justify-between px-4 py-2 pl-6 text-left"
                    >
                      <span className="text-gray-600 text-xs flex items-center gap-1">
                        {expandedItems.has(item.name) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        {item.name}
                      </span>
                      <span className="text-gray-700 text-xs">${formatCurrencyDetail(item.amount)}</span>
                    </button>
                    {expandedItems.has(item.name) && (
                      <TransactionList
                        transactions={transactions[item.name]}
                        isLoading={loadingItems.has(item.name)}
                        formatDate={formatDate}
                        formatCurrency={formatCurrencyDetail}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Modal - Centered */}
      {infoModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-800">{infoModal.name}</h3>
              <button
                onClick={() => setInfoModal(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 -mr-1 -mt-1"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{infoModal.description}</p>
            {infoModal.examples && infoModal.examples.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Examples:</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {infoModal.examples.map((ex, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {infoModal.taxLine && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-700">Tax Line:</div>
                <div className="text-sm text-blue-800">{infoModal.taxLine}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Transaction list for expanded items
function TransactionList({
  transactions,
  isLoading,
  formatDate,
  formatCurrency
}: {
  transactions: Transaction[] | undefined
  isLoading: boolean
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
}) {
  if (isLoading) {
    return <div className="px-6 py-3 text-gray-400 text-xs">Loading...</div>
  }

  if (!transactions?.length) {
    return <div className="px-6 py-3 text-gray-400 text-xs">No transactions</div>
  }

  return (
    <div className="bg-blue-50/50 mx-2 mb-2 rounded-lg">
      {transactions.slice(0, 10).map((t, i) => (
        <div key={i} className="flex justify-between px-3 py-2 border-b border-white/50 last:border-b-0">
          <div className="flex-1 min-w-0">
            <div className="text-gray-700 text-xs truncate">{t.description}</div>
            <div className="text-gray-400 text-[10px]">{formatDate(t.date)}</div>
          </div>
          <div className="text-gray-800 text-xs font-medium ml-2">${formatCurrency(t.amount)}</div>
        </div>
      ))}
      {transactions.length > 10 && (
        <div className="px-3 py-2 text-gray-500 text-xs text-center">
          +{transactions.length - 10} more
        </div>
      )}
    </div>
  )
}
