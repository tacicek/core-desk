import { test, expect } from '@playwright/test'

test.describe('Invoice Creation Flow', () => {
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
    
    // Navigate to invoice creation page
    await page.goto('/invoices/new')
  })

  test('should display invoice creation form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create invoice/i })).toBeVisible()
    
    // Check main form sections
    await expect(page.getByText(/customer information/i)).toBeVisible()
    await expect(page.getByText(/invoice details/i)).toBeVisible()
    await expect(page.getByText(/items/i)).toBeVisible()
    
    // Check required form fields
    await expect(page.getByLabel(/customer/i)).toBeVisible()
    await expect(page.getByLabel(/invoice date/i)).toBeVisible()
    await expect(page.getByLabel(/due date/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to save without filling required fields
    await page.getByRole('button', { name: /save invoice/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/customer is required/i)).toBeVisible()
    await expect(page.getByText(/at least one item is required/i)).toBeVisible()
  })

  test('should handle customer selection', async ({ page }) => {
    const customerSelect = page.getByLabel(/customer/i)
    
    // Open customer dropdown
    await customerSelect.click()
    
    // Should show customer options
    await expect(page.getByRole('option', { name: /add new customer/i })).toBeVisible()
    
    // Select "Add new customer"
    await page.getByRole('option', { name: /add new customer/i }).click()
    
    // Should open customer creation dialog
    await expect(page.getByRole('dialog', { name: /add customer/i })).toBeVisible()
    
    // Fill customer details
    await page.getByLabel(/company name/i).fill('Test Customer Ltd.')
    await page.getByLabel(/email/i).fill('customer@test.com')
    await page.getByLabel(/phone/i).fill('+41 12 345 67 89')
    
    // Save customer
    await page.getByRole('button', { name: /save customer/i }).click()
    
    // Dialog should close and customer should be selected
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(customerSelect).toHaveValue(/test customer ltd/i)
  })

  test('should add and calculate invoice items', async ({ page }) => {
    // First select a customer
    await page.getByLabel(/customer/i).click()
    await page.getByRole('option', { name: /test customer/i }).click()
    
    // Add first item
    await page.getByRole('button', { name: /add item/i }).click()
    
    // Fill item details
    const firstItemRow = page.locator('[data-testid="invoice-item-0"]')
    await firstItemRow.getByLabel(/description/i).fill('Website Development')
    await firstItemRow.getByLabel(/quantity/i).fill('1')
    await firstItemRow.getByLabel(/unit price/i).fill('2500.00')
    
    // Check calculation
    await expect(firstItemRow.getByLabel(/total/i)).toHaveValue('2500.00')
    
    // Add second item
    await page.getByRole('button', { name: /add item/i }).click()
    
    const secondItemRow = page.locator('[data-testid="invoice-item-1"]')
    await secondItemRow.getByLabel(/description/i).fill('Domain Registration')
    await secondItemRow.getByLabel(/quantity/i).fill('1')
    await secondItemRow.getByLabel(/unit price/i).fill('50.00')
    
    // Check subtotal calculation
    await expect(page.getByTestId('subtotal')).toHaveText('2550.00')
    
    // Check VAT calculation (assuming 8.1% VAT)
    await expect(page.getByTestId('vat-amount')).toHaveText('206.55')
    
    // Check total calculation
    await expect(page.getByTestId('total-amount')).toHaveText('2756.55')
  })

  test('should handle product selection from catalog', async ({ page }) => {
    // Select customer first
    await page.getByLabel(/customer/i).click()
    await page.getByRole('option', { name: /test customer/i }).click()
    
    // Add item and select from product catalog
    await page.getByRole('button', { name: /add item/i }).click()
    
    const itemRow = page.locator('[data-testid="invoice-item-0"]')
    await itemRow.getByRole('button', { name: /select product/i }).click()
    
    // Should open product selection dialog
    await expect(page.getByRole('dialog', { name: /select product/i })).toBeVisible()
    
    // Filter products by category
    await page.getByLabel(/category/i).selectOption('software')
    
    // Select a product
    await page.getByRole('button', { name: /select.*software license/i }).click()
    
    // Product details should be filled automatically
    await expect(itemRow.getByLabel(/description/i)).toHaveValue('Software License')
    await expect(itemRow.getByLabel(/unit price/i)).toHaveValue('299.00')
  })

  test('should remove invoice items', async ({ page }) => {
    await page.getByLabel(/customer/i).click()
    await page.getByRole('option', { name: /test customer/i }).click()
    
    // Add two items
    await page.getByRole('button', { name: /add item/i }).click()
    await page.getByRole('button', { name: /add item/i }).click()
    
    expect(await page.locator('[data-testid^="invoice-item-"]').count()).toBe(2)
    
    // Remove first item
    await page.locator('[data-testid="invoice-item-0"]').getByRole('button', { name: /remove/i }).click()
    
    expect(await page.locator('[data-testid^="invoice-item-"]').count()).toBe(1)
  })

  test('should handle invoice number generation', async ({ page }) => {
    // Invoice number should be auto-generated
    const invoiceNumberField = page.getByLabel(/invoice number/i)
    await expect(invoiceNumberField).toHaveValue(/INV-\d{4}-\d{3}/)
    
    // Should be editable
    await invoiceNumberField.clear()
    await invoiceNumberField.fill('CUSTOM-001')
    await expect(invoiceNumberField).toHaveValue('CUSTOM-001')
  })

  test('should set default dates', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Invoice date should default to today
    await expect(page.getByLabel(/invoice date/i)).toHaveValue(today)
    
    // Due date should default to 30 days from now
    await expect(page.getByLabel(/due date/i)).toHaveValue(dueDate)
  })

  test('should save invoice as draft', async ({ page }) => {
    // Fill minimum required fields
    await page.getByLabel(/customer/i).click()
    await page.getByRole('option', { name: /test customer/i }).click()
    
    // Add one item
    await page.getByRole('button', { name: /add item/i }).click()
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/description/i).fill('Test Service')
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/unit price/i).fill('100.00')
    
    // Save as draft
    await page.getByRole('button', { name: /save draft/i }).click()
    
    // Should show success message
    await expect(page.getByText(/invoice saved as draft/i)).toBeVisible()
    
    // Should redirect to invoice list
    await expect(page).toHaveURL(/.*invoices$/)
  })

  test('should generate and preview PDF', async ({ page }) => {
    // Setup complete invoice
    await page.getByLabel(/customer/i).click()
    await page.getByRole('option', { name: /test customer/i }).click()
    
    await page.getByRole('button', { name: /add item/i }).click()
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/description/i).fill('Consulting Services')
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/unit price/i).fill('150.00')
    
    // Preview PDF
    await page.getByRole('button', { name: /preview pdf/i }).click()
    
    // Should open PDF preview dialog
    await expect(page.getByRole('dialog', { name: /pdf preview/i })).toBeVisible()
    
    // Should show PDF embed or download link
    await expect(page.getByText(/download pdf/i)).toBeVisible()
  })

  test('should handle currency selection', async ({ page }) => {
    const currencySelect = page.getByLabel(/currency/i)
    
    // Should default to CHF
    await expect(currencySelect).toHaveValue('CHF')
    
    // Change to EUR
    await currencySelect.selectOption('EUR')
    await expect(currencySelect).toHaveValue('EUR')
    
    // Currency symbol should update in calculations
    await page.getByRole('button', { name: /add item/i }).click()
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/unit price/i).fill('100.00')
    
    await expect(page.getByTestId('total-amount')).toContainText('€')
  })

  test('should add notes and terms', async ({ page }) => {
    // Expand additional sections
    await page.getByRole('button', { name: /additional details/i }).click()
    
    // Add notes
    await page.getByLabel(/notes/i).fill('Thank you for your business!')
    
    // Add payment terms
    await page.getByLabel(/payment terms/i).fill('Payment due within 30 days')
    
    // Save and verify
    await page.getByLabel(/customer/i).click()
    await page.getByRole('option', { name: /test customer/i }).click()
    
    await page.getByRole('button', { name: /add item/i }).click()
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/description/i).fill('Test')
    await page.locator('[data-testid="invoice-item-0"]').getByLabel(/unit price/i).fill('100')
    
    await page.getByRole('button', { name: /save draft/i }).click()
    
    await expect(page.getByText(/invoice saved/i)).toBeVisible()
  })
})

test.describe('Invoice Editing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to edit existing invoice
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/invoices/test-invoice-id/edit')
  })

  test('should load existing invoice data', async ({ page }) => {
    // Should load with existing data (mocked)
    await expect(page.getByLabel(/customer/i)).toHaveValue(/existing customer/i)
    await expect(page.getByLabel(/invoice number/i)).toHaveValue('INV-2024-001')
    
    // Should show existing items
    expect(await page.locator('[data-testid^="invoice-item-"]').count()).toBeGreaterThan(0)
  })

  test('should prevent editing sent invoices', async ({ page }) => {
    // If invoice is already sent, fields should be disabled
    const status = await page.getByTestId('invoice-status').textContent()
    
    if (status?.includes('Sent')) {
      await expect(page.getByLabel(/customer/i)).toBeDisabled()
      await expect(page.getByRole('button', { name: /save/i })).toBeDisabled()
    }
  })
})

test.describe('Mobile Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/invoices/new')
  })

  test('should display mobile-optimized form', async ({ page }) => {
    // Form should be responsive
    const form = page.locator('form').first()
    const boundingBox = await form.boundingBox()
    
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
    
    // Should have mobile-friendly spacing
    await expect(page.getByLabel(/customer/i)).toBeVisible()
  })

  test('should handle mobile item management', async ({ page }) => {
    // Add item button should be accessible
    await page.getByRole('button', { name: /add item/i }).click()
    
    // Item form should be mobile-friendly
    const itemRow = page.locator('[data-testid="invoice-item-0"]')
    await expect(itemRow).toBeVisible()
    
    // Fields should be properly sized
    await itemRow.getByLabel(/description/i).fill('Mobile test')
    await expect(itemRow.getByLabel(/description/i)).toHaveValue('Mobile test')
  })
})

test.describe('Invoice Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }))
    })
    
    await page.goto('/invoices/new')
  })

  test('should have proper form labels and structure', async ({ page }) => {
    // All form fields should have labels
    await expect(page.getByLabel(/customer/i)).toBeVisible()
    await expect(page.getByLabel(/invoice date/i)).toBeVisible()
    await expect(page.getByLabel(/due date/i)).toBeVisible()
    
    // Form should have proper structure
    await expect(page.getByRole('form')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/customer/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/invoice number/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/invoice date/i)).toBeFocused()
  })

  test('should announce dynamic content changes', async ({ page }) => {
    // Add item and check for announcements
    await page.getByRole('button', { name: /add item/i }).click()
    
    // New item row should be announced to screen readers
    const newItem = page.locator('[data-testid="invoice-item-0"]')
    await expect(newItem).toHaveAttribute('aria-label', /item 1/i)
  })
})