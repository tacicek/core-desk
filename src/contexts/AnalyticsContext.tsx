import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useVendor } from '@/contexts/VendorContext'
import { toast } from 'sonner'

// Analytics data types
export interface RevenueAnalytics {
  period_start: string
  period_end: string
  total_revenue: number
  paid_revenue: number
  pending_revenue: number
  invoice_count: number
  avg_invoice_value: number
  growth_rate: number | null
  period_label: string
}

export interface CustomerSegment {
  segment: string
  customer_count: number
  total_revenue: number
  avg_revenue_per_customer: number
  percentage_of_customers: number
  percentage_of_revenue: number
}

export interface BusinessHealthMetric {
  metric_name: string
  current_value: number
  previous_value: number | null
  change_percentage: number | null
  trend: 'up' | 'down' | 'stable'
  benchmark: string
}

export interface CustomerAnalytics {
  customer_id: string
  customer_name: string
  email: string
  total_invoices: number
  total_revenue: number
  paid_revenue: number
  avg_invoice_value: number
  last_invoice_date: string | null
  first_invoice_date: string | null
  overdue_count: number
  status: 'active' | 'inactive' | 'dormant'
}

export interface ProductAnalytics {
  product_id: string
  product_name: string
  category: string
  times_sold: number
  total_quantity_sold: number
  total_revenue: number
  avg_selling_price: number
  last_sold_date: string | null
  unique_customers: number
}

export interface ExpenseAnalytics {
  month: string
  expense_type: string
  tax_category: string
  expense_count: number
  total_amount: number
  total_net_amount: number
  total_vat_amount: number
  avg_expense: number
}

export interface AnalyticsSummary {
  total_revenue: number
  total_expenses: number
  profit_margin: number
  active_customers: number
  total_invoices: number
  paid_invoices: number
  overdue_invoices: number
  avg_invoice_value: number
  top_customer: string | null
  top_product: string | null
  monthly_growth: number | null
}

interface AnalyticsContextType {
  // Core analytics data
  revenueAnalytics: RevenueAnalytics[]
  customerSegments: CustomerSegment[]
  businessHealthMetrics: BusinessHealthMetric[]
  customerAnalytics: CustomerAnalytics[]
  productAnalytics: ProductAnalytics[]
  expenseAnalytics: ExpenseAnalytics[]
  analyticsSummary: AnalyticsSummary | null
  
  // State
  isLoading: boolean
  lastRefresh: Date | null
  
  // Actions
  refreshAnalytics: () => Promise<void>
  getRevenueAnalytics: (period: string, startDate?: string, endDate?: string) => Promise<RevenueAnalytics[]>
  getCustomerInsights: () => Promise<CustomerSegment[]>
  getBusinessHealth: (periodMonths?: number) => Promise<BusinessHealthMetric[]>
  
  // Filtering and configuration
  dateRange: { start: Date; end: Date }
  setDateRange: (range: { start: Date; end: Date }) => void
  refreshInterval: number
  setRefreshInterval: (interval: number) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

interface AnalyticsProviderProps {
  children: ReactNode
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const { vendor } = useVendor()
  
  // Core state
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics[]>([])
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([])
  const [businessHealthMetrics, setBusinessHealthMetrics] = useState<BusinessHealthMetric[]>([])
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics[]>([])
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([])
  const [expenseAnalytics, setExpenseAnalytics] = useState<ExpenseAnalytics[]>([])
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null)
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  // Configuration
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
    end: new Date()
  })
  const [refreshInterval, setRefreshInterval] = useState(300000) // 5 minutes

  // Fetch revenue analytics
  const getRevenueAnalytics = useCallback(async (
    period: string = 'month',
    startDate?: string,
    endDate?: string
  ): Promise<RevenueAnalytics[]> => {
    if (!vendor?.id) return []

    try {
      const { data, error } = await supabase
        .rpc('get_revenue_trends', {
          p_vendor_id: vendor.id,
          p_period: period,
          p_start_date: startDate || dateRange.start.toISOString().split('T')[0],
          p_end_date: endDate || dateRange.end.toISOString().split('T')[0]
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
      toast.error('Failed to load revenue analytics')
      return []
    }
  }, [vendor?.id, dateRange])

  // Fetch customer segmentation
  const getCustomerInsights = useCallback(async (): Promise<CustomerSegment[]> => {
    if (!vendor?.id) return []

    try {
      const { data, error } = await supabase
        .rpc('get_customer_segmentation', {
          p_vendor_id: vendor.id
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customer insights:', error)
      toast.error('Failed to load customer insights')
      return []
    }
  }, [vendor?.id])

  // Fetch business health metrics
  const getBusinessHealth = useCallback(async (periodMonths: number = 12): Promise<BusinessHealthMetric[]> => {
    if (!vendor?.id) return []

    try {
      const { data, error } = await supabase
        .rpc('get_business_health_metrics', {
          p_vendor_id: vendor.id,
          p_period_months: periodMonths
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching business health metrics:', error)
      toast.error('Failed to load business health metrics')
      return []
    }
  }, [vendor?.id])

  // Fetch customer analytics
  const fetchCustomerAnalytics = useCallback(async () => {
    if (!vendor?.id) return

    try {
      const { data, error } = await supabase
        .from('customer_analytics')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('total_revenue', { ascending: false })
        .limit(100)

      if (error) throw error
      setCustomerAnalytics(data || [])
    } catch (error) {
      console.error('Error fetching customer analytics:', error)
    }
  }, [vendor?.id])

  // Fetch product analytics
  const fetchProductAnalytics = useCallback(async () => {
    if (!vendor?.id) return

    try {
      const { data, error } = await supabase
        .from('product_analytics')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('total_revenue', { ascending: false })
        .limit(50)

      if (error) throw error
      setProductAnalytics(data || [])
    } catch (error) {
      console.error('Error fetching product analytics:', error)
    }
  }, [vendor?.id])

  // Fetch expense analytics
  const fetchExpenseAnalytics = useCallback(async () => {
    if (!vendor?.id) return

    try {
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)

      const { data, error } = await supabase
        .from('expense_analytics')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('month', startDate.toISOString().split('T')[0])
        .lte('month', endDate.toISOString().split('T')[0])
        .order('month', { ascending: false })

      if (error) throw error
      setExpenseAnalytics(data || [])
    } catch (error) {
      console.error('Error fetching expense analytics:', error)
    }
  }, [vendor?.id, dateRange])

  // Calculate analytics summary
  const calculateAnalyticsSummary = useCallback(async () => {
    if (!vendor?.id) return

    try {
      // Get basic metrics from current period
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('total, status, customer_id')
        .eq('vendor_id', vendor.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())

      if (invoiceError) throw invoiceError

      const { data: expenseData, error: expenseError } = await supabase
        .from('business_expenses')
        .select('amount')
        .eq('vendor_id', vendor.id)
        .gte('expense_date', dateRange.start.toISOString().split('T')[0])
        .lte('expense_date', dateRange.end.toISOString().split('T')[0])

      if (expenseError) throw expenseError

      const invoices = invoiceData || []
      const expenses = expenseData || []

      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const paidInvoices = invoices.filter(inv => inv.status === 'paid')
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
      const activeCustomers = new Set(invoices.map(inv => inv.customer_id)).size

      // Get top customer and product
      const topCustomer = customerAnalytics.length > 0 ? customerAnalytics[0].customer_name : null
      const topProduct = productAnalytics.length > 0 ? productAnalytics[0].product_name : null

      // Calculate monthly growth
      const lastMonth = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth() - 1, 1)
      const currentMonthRevenue = invoices
        .filter(inv => new Date(inv.created_at || '') >= lastMonth)
        .reduce((sum, inv) => sum + (inv.total || 0), 0)

      const previousMonth = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth() - 2, 1)
      const previousMonthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.created_at || '')
          return invDate >= previousMonth && invDate < lastMonth
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0)

      const monthlyGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : null

      setAnalyticsSummary({
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        profit_margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
        active_customers: activeCustomers,
        total_invoices: invoices.length,
        paid_invoices: paidInvoices.length,
        overdue_invoices: overdueInvoices.length,
        avg_invoice_value: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        top_customer: topCustomer,
        top_product: topProduct,
        monthly_growth: monthlyGrowth
      })
    } catch (error) {
      console.error('Error calculating analytics summary:', error)
    }
  }, [vendor?.id, dateRange, customerAnalytics, productAnalytics])

  // Refresh all analytics data
  const refreshAnalytics = useCallback(async () => {
    if (!vendor?.id) return

    setIsLoading(true)
    try {
      // Fetch all analytics data in parallel
      const [
        revenueData,
        customerSegmentData,
        businessHealthData
      ] = await Promise.all([
        getRevenueAnalytics('month'),
        getCustomerInsights(),
        getBusinessHealth(12)
      ])

      setRevenueAnalytics(revenueData)
      setCustomerSegments(customerSegmentData)
      setBusinessHealthMetrics(businessHealthData)

      // Fetch additional analytics
      await Promise.all([
        fetchCustomerAnalytics(),
        fetchProductAnalytics(),
        fetchExpenseAnalytics()
      ])

      // Calculate summary after all data is loaded
      await calculateAnalyticsSummary()
      
      setLastRefresh(new Date())
      toast.success('Analytics data refreshed')
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      toast.error('Failed to refresh analytics data')
    } finally {
      setIsLoading(false)
    }
  }, [
    vendor?.id,
    getRevenueAnalytics,
    getCustomerInsights,
    getBusinessHealth,
    fetchCustomerAnalytics,
    fetchProductAnalytics,
    fetchExpenseAnalytics,
    calculateAnalyticsSummary
  ])

  // Initial load
  useEffect(() => {
    if (vendor?.id) {
      refreshAnalytics()
    }
  }, [vendor?.id, dateRange])

  // Auto-refresh setup
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshAnalytics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshAnalytics, refreshInterval])

  const value: AnalyticsContextType = {
    // Core analytics data
    revenueAnalytics,
    customerSegments,
    businessHealthMetrics,
    customerAnalytics,
    productAnalytics,
    expenseAnalytics,
    analyticsSummary,
    
    // State
    isLoading,
    lastRefresh,
    
    // Actions
    refreshAnalytics,
    getRevenueAnalytics,
    getCustomerInsights,
    getBusinessHealth,
    
    // Configuration
    dateRange,
    setDateRange,
    refreshInterval,
    setRefreshInterval
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// Custom hooks for specific analytics
export const useRevenueAnalytics = () => {
  const { revenueAnalytics, getRevenueAnalytics, isLoading } = useAnalytics()
  return { revenueAnalytics, getRevenueAnalytics, isLoading }
}

export const useCustomerInsights = () => {
  const { customerSegments, customerAnalytics, getCustomerInsights, isLoading } = useAnalytics()
  return { customerSegments, customerAnalytics, getCustomerInsights, isLoading }
}

export const useBusinessHealth = () => {
  const { businessHealthMetrics, getBusinessHealth, isLoading } = useAnalytics()
  return { businessHealthMetrics, getBusinessHealth, isLoading }
}

export const useAnalyticsSummary = () => {
  const { analyticsSummary, refreshAnalytics, isLoading, lastRefresh } = useAnalytics()
  return { analyticsSummary, refreshAnalytics, isLoading, lastRefresh }
}