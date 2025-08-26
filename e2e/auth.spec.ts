import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should display login form by default', async ({ page }) => {
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*auth/)
    
    // Check login form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    // Try to login without filling fields
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should attempt login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show loading state
    await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible()
    
    // Note: In a real test, you'd mock the Supabase response or use test credentials
    // For now, we'll check that the attempt was made
    await page.waitForTimeout(1000)
  })

  test('should navigate to registration form', async ({ page }) => {
    // Click on sign up link
    await page.getByRole('link', { name: /sign up/i }).click()
    
    // Should show registration form
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should validate registration form', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click()
    
    // Test password mismatch
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel(/confirm password/i).fill('differentpassword')
    
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordField = page.getByLabel(/password/i).first()
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i }).first()
    
    // Password field should be type="password" initially
    await expect(passwordField).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordField).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordField).toHaveAttribute('type', 'password')
  })

  test('should navigate between login and signup forms', async ({ page }) => {
    // Start on login form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    
    // Go to signup
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    
    // Go back to login
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('should show forgot password option', async ({ page }) => {
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
    
    await page.getByRole('link', { name: /forgot password/i }).click()
    
    // Should show password reset form
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })
})

test.describe('Authenticated State', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      // Mock localStorage with auth tokens
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
    
    await page.goto('/')
  })

  test('should redirect to dashboard when authenticated', async ({ page }) => {
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Should show dashboard elements
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should show user menu in navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should show user menu
    await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
    
    // Click user menu
    await page.getByRole('button', { name: /user menu/i }).click()
    
    // Should show logout option
    await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Open user menu and logout
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('menuitem', { name: /logout/i }).click()
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })
})

test.describe('Mobile Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
  })

  test('should display mobile-optimized login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    
    // Check that form is properly sized for mobile
    const form = page.locator('form').first()
    const boundingBox = await form.boundingBox()
    
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
  })

  test('should handle mobile keyboard interactions', async ({ page }) => {
    const emailField = page.getByLabel(/email/i)
    const passwordField = page.getByLabel(/password/i)
    
    // Focus email field
    await emailField.focus()
    await expect(emailField).toBeFocused()
    
    // Tab to password field
    await page.keyboard.press('Tab')
    await expect(passwordField).toBeFocused()
    
    // Tab to submit button
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
  })
})

test.describe('Authentication Accessibility', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/')
    
    // Check form accessibility
    await expect(page.getByRole('form')).toBeVisible()
    
    // Check input labels
    await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-label')
    await expect(page.getByLabel(/password/i)).toHaveAttribute('aria-label')
    
    // Check button accessibility
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await expect(submitButton).toHaveAttribute('type', 'submit')
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/password/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
    
    // Should be able to submit with Enter
    await page.keyboard.press('Enter')
  })

  test('should announce errors to screen readers', async ({ page }) => {
    await page.goto('/')
    
    // Submit empty form to trigger validation
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check that error messages have proper ARIA attributes
    const errorMessage = page.getByText(/email is required/i)
    await expect(errorMessage).toHaveAttribute('role', 'alert')
  })
})

test.describe('Authentication Security', () => {
  test('should not expose sensitive data in DOM', async ({ page }) => {
    await page.goto('/')
    
    // Fill password field
    await page.getByLabel(/password/i).fill('secretpassword123')
    
    // Check that password is not visible in DOM
    const pageContent = await page.content()
    expect(pageContent).not.toContain('secretpassword123')
  })

  test('should handle rate limiting gracefully', async ({ page }) => {
    await page.goto('/')
    
    // Simulate multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Wait a bit between attempts
      await page.waitForTimeout(100)
    }
    
    // Should handle gracefully (exact behavior depends on implementation)
    // For now, just ensure the form is still functional
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})