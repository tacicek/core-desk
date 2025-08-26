import { test, expect } from '@playwright/test'

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000,
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should display dashboard overview', async ({ page }) => {
    // Main dashboard heading
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Key metrics should be visible
    await expect(page.getByTestId('total-revenue')).toBeVisible()
    await expect(page.getByTestId('total-expenses')).toBeVisible()
    await expect(page.getByTestId('profit-margin')).toBeVisible()
    await expect(page.getByTestId('pending-invoices')).toBeVisible()
    
    // Charts should be loaded
    await expect(page.getByTestId('revenue-chart')).toBeVisible()
    await expect(page.getByTestId('expenses-chart')).toBeVisible()
  })

  test('should display recent activities', async ({ page }) => {
    // Recent activities section
    await expect(page.getByRole('heading', { name: /recent activities/i })).toBeVisible()
    
    // Should show recent invoices, expenses, etc.
    await expect(page.getByTestId('recent-invoices')).toBeVisible()
    await expect(page.getByTestId('recent-expenses')).toBeVisible()
  })

  test('should have functional navigation menu', async ({ page }) => {
    // Main navigation should be visible
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check main menu items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /invoices/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /customers/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /expenses/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /reports/i })).toBeVisible()
  })

  test('should navigate to different sections', async ({ page }) => {
    // Navigate to invoices
    await page.getByRole('link', { name: /invoices/i }).click()
    await expect(page).toHaveURL(/.*invoices/)
    await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible()
    
    // Navigate to customers
    await page.getByRole('link', { name: /customers/i }).click()
    await expect(page).toHaveURL(/.*customers/)
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible()
    
    // Navigate to products
    await page.getByRole('link', { name: /products/i }).click()
    await expect(page).toHaveURL(/.*products/)
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should show user profile menu', async ({ page }) => {
    // User menu should be visible
    await expect(page.getByTestId('user-menu')).toBeVisible()
    
    // Click user menu
    await page.getByTestId('user-menu').click()
    
    // User menu options should appear
    await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /api management/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible()
  })

  test('should display correct financial metrics', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="total-revenue"]')
    
    // Metrics should display currency
    const revenueText = await page.getByTestId('total-revenue').textContent()
    expect(revenueText).toMatch(/CHF|€|\$/)
    
    const expensesText = await page.getByTestId('total-expenses').textContent()
    expect(expensesText).toMatch(/CHF|€|\$/)
  })

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty data scenario
    await page.evaluate(() => {
      // Override API responses to return empty data
      window.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], error: null })
      })
    })
    
    await page.reload()
    
    // Should show appropriate empty states
    await expect(page.getByText(/no recent invoices/i)).toBeVisible()
    await expect(page.getByText(/no recent expenses/i)).toBeVisible()
  })
})

test.describe('Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should provide quick action buttons', async ({ page }) => {
    // Quick action buttons should be visible
    await expect(page.getByRole('button', { name: /create invoice/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add expense/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add customer/i })).toBeVisible()
  })

  test('should navigate to invoice creation', async ({ page }) => {
    await page.getByRole('button', { name: /create invoice/i }).click()
    
    await expect(page).toHaveURL(/.*invoices\/new/)
    await expect(page.getByRole('heading', { name: /create invoice/i })).toBeVisible()
  })

  test('should open expense creation modal', async ({ page }) => {
    await page.getByRole('button', { name: /add expense/i }).click()
    
    // Should open expense modal
    await expect(page.getByRole('dialog', { name: /add expense/i })).toBeVisible()
    await expect(page.getByLabel(/amount/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
  })

  test('should open customer creation modal', async ({ page }) => {
    await page.getByRole('button', { name: /add customer/i }).click()
    
    // Should open customer modal
    await expect(page.getByRole('dialog', { name: /add customer/i })).toBeVisible()
    await expect(page.getByLabel(/company name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

test.describe('Data Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should display revenue chart', async ({ page }) => {
    const chart = page.getByTestId('revenue-chart')
    await expect(chart).toBeVisible()
    
    // Chart should have data
    await expect(chart.locator('svg')).toBeVisible()
  })

  test('should display expenses breakdown', async ({ page }) => {
    const chart = page.getByTestId('expenses-chart')
    await expect(chart).toBeVisible()
    
    // Should show expense categories
    await expect(chart.locator('svg')).toBeVisible()
  })

  test('should allow chart period selection', async ({ page }) => {
    // Time period selector
    const periodSelect = page.getByLabel(/time period/i)
    await expect(periodSelect).toBeVisible()
    
    // Change to different period
    await periodSelect.selectOption('last-quarter')
    
    // Charts should update (check for loading indicator)
    await expect(page.getByTestId('chart-loading')).toBeVisible()
    await expect(page.getByTestId('chart-loading')).not.toBeVisible()
  })
})

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should have global search functionality', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: /search/i })
    await expect(searchInput).toBeVisible()
    
    // Type search query
    await searchInput.fill('invoice')
    
    // Should show search suggestions or results
    await expect(page.getByTestId('search-results')).toBeVisible()
  })

  test('should filter dashboard data', async ({ page }) => {
    // Date range filter
    const dateFilter = page.getByLabel(/date range/i)
    await expect(dateFilter).toBeVisible()
    
    // Status filter
    const statusFilter = page.getByLabel(/status/i)
    await expect(statusFilter).toBeVisible()
    
    // Apply filters
    await statusFilter.selectOption('paid')
    
    // Data should update
    await page.waitForSelector('[data-testid="filtered-results"]')
  })
})

test.describe('Notifications and Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should display notification center', async ({ page }) => {
    const notificationButton = page.getByRole('button', { name: /notifications/i })
    await expect(notificationButton).toBeVisible()
    
    // Click to open notifications
    await notificationButton.click()
    
    // Notification panel should open
    await expect(page.getByTestId('notification-panel')).toBeVisible()
  })

  test('should show overdue invoice alerts', async ({ page }) => {
    // Should display alert banner for overdue invoices
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/overdue invoices/i)).toBeVisible()
  })

  test('should show system status', async ({ page }) => {
    // System status indicator
    const statusIndicator = page.getByTestId('system-status')
    await expect(statusIndicator).toBeVisible()
    
    // Should show "online" or similar status
    await expect(statusIndicator).toHaveClass(/status-online|text-green/)
  })
})

test.describe('Mobile Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/dashboard')
  })

  test('should display mobile navigation', async ({ page }) => {
    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i })
    await expect(menuButton).toBeVisible()
    
    // Click to open mobile menu
    await menuButton.click()
    
    // Navigation menu should slide in
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should have responsive layout', async ({ page }) => {
    // Metrics should stack vertically on mobile
    const metricsContainer = page.getByTestId('metrics-container')
    const boundingBox = await metricsContainer.boundingBox()
    
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
  })

  test('should handle touch interactions', async ({ page }) => {
    // Swipe gesture on charts (if implemented)
    const chart = page.getByTestId('revenue-chart')
    
    // Touch and drag
    await chart.hover()
    await page.mouse.down()
    await page.mouse.move(100, 0)
    await page.mouse.up()
    
    // Chart should respond to touch interaction
    // (Exact behavior depends on chart implementation)
  })
})

test.describe('Performance and Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
  })

  test('should show loading states while data loads', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Should show loading indicators initially
    await expect(page.getByTestId('metrics-loading')).toBeVisible()
    await expect(page.getByTestId('chart-loading')).toBeVisible()
    
    // Loading should complete
    await expect(page.getByTestId('metrics-loading')).not.toBeVisible()
    await expect(page.getByTestId('chart-loading')).not.toBeVisible()
  })

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 2000)
    })
    
    await page.goto('/dashboard')
    
    // Should show extended loading state
    await expect(page.getByTestId('loading-skeleton')).toBeVisible()
    
    // Eventually should load content
    await expect(page.getByTestId('dashboard-content')).toBeVisible({ timeout: 10000 })
  })

  test('should handle offline state', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Simulate going offline
    await page.setOfflineMode(true)
    
    // Should show offline indicator
    await expect(page.getByText(/offline/i)).toBeVisible()
    
    // Some cached content should still be available
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})