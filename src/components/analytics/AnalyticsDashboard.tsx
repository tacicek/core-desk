import React, { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  useAnalytics, 
  useAnalyticsSummary,
  useRevenueAnalytics,
  useCustomerInsights,
  useBusinessHealth 
} from '@/contexts/AnalyticsContext'

// Color palette for charts
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316',
  info: '#06b6d4',
  purple: '#8b5cf6'
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.info
]

// Main Analytics Dashboard
export const AnalyticsDashboard = () => {
  const { dateRange, setDateRange, refreshAnalytics, isLoading, lastRefresh } = useAnalytics()
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <DatePicker
              selected={dateRange.start}
              onSelect={(date) => date && setDateRange({ ...dateRange, start: date })}
              placeholder="Start date"
            />
            <span>to</span>
            <DatePicker
              selected={dateRange.end}
              onSelect={(date) => date && setDateRange({ ...dateRange, end: date })}
              placeholder="End date"
            />
          </div>
          
          {/* Period Selector */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Actions */}
          <Button
            variant="outline"
            onClick={refreshAnalytics}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastRefresh && (
        <p className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleString()}
        </p>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="health">Business Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewDashboard period={selectedPeriod} />
        </TabsContent>
        
        <TabsContent value="revenue">
          <RevenueAnalyticsDashboard period={selectedPeriod} />
        </TabsContent>
        
        <TabsContent value="customers">
          <CustomerAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="health">
          <BusinessHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Overview Dashboard Tab
const OverviewDashboard = ({ period }: { period: string }) => {
  const { analyticsSummary, isLoading } = useAnalyticsSummary()

  if (isLoading || !analyticsSummary) {
    return <AnalyticsLoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={`CHF ${analyticsSummary.total_revenue.toLocaleString()}`}
          change={analyticsSummary.monthly_growth}
          icon={<DollarSign className="h-4 w-4" />}
          trend={analyticsSummary.monthly_growth && analyticsSummary.monthly_growth > 0 ? 'up' : 'down'}
        />
        
        <KPICard
          title="Profit Margin"
          value={`${analyticsSummary.profit_margin.toFixed(1)}%`}
          change={null}
          icon={<Target className="h-4 w-4" />}
          trend={analyticsSummary.profit_margin > 20 ? 'up' : 'down'}
        />
        
        <KPICard
          title="Active Customers"
          value={analyticsSummary.active_customers.toString()}
          change={null}
          icon={<Users className="h-4 w-4" />}
          trend="up"
        />
        
        <KPICard
          title="Avg Invoice Value"
          value={`CHF ${analyticsSummary.avg_invoice_value.toLocaleString()}`}
          change={null}
          icon={<BarChart3 className="h-4 w-4" />}
          trend="stable"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueOverviewChart period={period} />
        <CustomerSegmentChart />
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopPerformersCard />
        <RecentTrendsCard />
        <QuickInsightsCard />
      </div>
    </div>
  )
}

// Revenue Analytics Dashboard
const RevenueAnalyticsDashboard = ({ period }: { period: string }) => {
  const { revenueAnalytics, getRevenueAnalytics, isLoading } = useRevenueAnalytics()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>
              Track your revenue performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period_label" />
                <YAxis />
                <Tooltip formatter={(value) => [`CHF ${Number(value).toLocaleString()}`, 'Revenue']} />
                <Area 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke={CHART_COLORS.primary} 
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.1}
                />
                <Area 
                  type="monotone" 
                  dataKey="paid_revenue" 
                  stroke={CHART_COLORS.secondary} 
                  fill={CHART_COLORS.secondary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Paid Revenue</span>
                <span className="text-sm text-gray-600">
                  CHF {revenueAnalytics.reduce((sum, item) => sum + item.paid_revenue, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending Revenue</span>
                <span className="text-sm text-gray-600">
                  CHF {revenueAnalytics.reduce((sum, item) => sum + item.pending_revenue, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Invoices</span>
                <span className="text-sm text-gray-600">
                  {revenueAnalytics.reduce((sum, item) => sum + item.invoice_count, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GrowthRateChart data={revenueAnalytics} />
    </div>
  )
}

// Customer Analytics Dashboard
const CustomerAnalyticsDashboard = () => {
  const { customerSegments, customerAnalytics } = useCustomerInsights()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerSegmentChart />
        <CustomerValueDistribution />
      </div>
      
      <TopCustomersTable customers={customerAnalytics} />
    </div>
  )
}

// Product Analytics Dashboard
const ProductAnalyticsDashboard = () => {
  const { productAnalytics } = useAnalytics()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductPerformanceChart products={productAnalytics} />
        <ProductCategoryChart products={productAnalytics} />
      </div>
      
      <TopProductsTable products={productAnalytics} />
    </div>
  )
}

// Business Health Dashboard
const BusinessHealthDashboard = () => {
  const { businessHealthMetrics } = useBusinessHealth()

  return (
    <div className="space-y-6">
      <BusinessHealthMetrics metrics={businessHealthMetrics} />
      <BusinessHealthChart metrics={businessHealthMetrics} />
    </div>
  )
}

// Component: KPI Card
interface KPICardProps {
  title: string
  value: string
  change: number | null
  icon: React.ReactNode
  trend: 'up' | 'down' | 'stable'
}

const KPICard = ({ title, value, change, icon, trend }: KPICardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />
      case 'down': return <TrendingDown className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          {change !== null && (
            <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Component: Loading Skeleton
const AnalyticsLoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Additional component implementations would go here...
// (CustomerSegmentChart, RevenueOverviewChart, etc.)

export { AnalyticsDashboard as default }