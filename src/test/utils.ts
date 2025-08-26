import { vi } from 'vitest'
import type { User, Session } from '@supabase/supabase-js'

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmation_sent_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides
})

export const createMockVendor = (overrides = {}) => ({
  id: 'test-vendor-id',
  name: 'Test Vendor',
  email: 'vendor@example.com',
  phone: '+41 12 345 67 89',
  address: JSON.stringify({
    street: 'Test Street 123',
    city: 'Zurich',
    postal_code: '8001',
    country: 'Switzerland'
  }),
  bank_account: JSON.stringify({
    iban: 'CH93 0076 2011 6238 5295 7',
    bank_name: 'UBS Switzerland AG'
  }),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  vendor_id: 'test-vendor-id',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+41 12 345 67 89',
  address: JSON.stringify({
    street: 'Customer Street 456',
    city: 'Basel',
    postal_code: '4001',
    country: 'Switzerland'
  }),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-id',
  vendor_id: 'test-vendor-id',
  name: 'Test Product',
  description: 'Test product description',
  unit_price: 99.90,
  tax_rate: 8.1,
  category: 'software',
  image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockInvoice = (overrides = {}) => ({
  id: 'test-invoice-id',
  vendor_id: 'test-vendor-id',
  customer_id: 'test-customer-id',
  invoice_no: 'TEST-2024-001',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  subtotal: 100.00,
  tax_total: 8.10,
  total: 108.10,
  status: 'draft',
  currency: 'CHF',
  notes: null,
  terms: null,
  pdf_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockBusinessExpense = (overrides = {}) => ({
  id: 'test-expense-id',
  vendor_id: 'test-vendor-id',
  vendor_name: 'Test Supplier',
  document_number: 'RECEIPT-001',
  expense_date: new Date().toISOString().split('T')[0],
  amount: 85.50,
  net_amount: 79.35,
  vat_amount: 6.15,
  vat_rate: 8.1,
  currency: 'CHF',
  description: 'Office supplies',
  business_purpose: 'Office equipment',
  expense_type: 'purchase',
  tax_category: 'operating_expenses',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

// Auth context mock
export const createMockAuthContext = (overrides = {}) => ({
  user: createMockUser(),
  session: createMockSession(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  loading: false,
  ...overrides
})

// Vendor context mock
export const createMockVendorContext = (overrides = {}) => ({
  vendor: createMockVendor(),
  isOwner: true,
  loading: false,
  refetch: vi.fn(),
  ...overrides
})

// Router mock helpers
export const createMockNavigate = () => vi.fn()
export const createMockLocation = (overrides = {}) => ({
  pathname: '/dashboard',
  search: '',
  hash: '',
  state: null,
  key: 'test-key',
  ...overrides
})

// API response mocks
export const createSuccessResponse = (data: any) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK'
})

export const createErrorResponse = (message: string, code?: string) => ({
  data: null,
  error: {
    message,
    code: code || 'UNKNOWN_ERROR',
    details: null,
    hint: null
  },
  status: 400,
  statusText: 'Bad Request'
})

// Testing utilities
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(document.querySelector('.loading-spinner')).not.toBeInTheDocument()
  }, { timeout: 5000 })
}

export const expectElementToBeVisible = async (element: HTMLElement) => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(element).toBeVisible()
  })
}

export const expectElementToHaveText = async (element: HTMLElement, text: string) => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(element).toHaveTextContent(text)
  })
}

// File upload helpers
export const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['test file content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

export const createMockFileList = (files: File[]) => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file
      }
    }
  }
  
  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, { value: file })
  })
  
  return fileList as FileList
}

// Form testing helpers
export const fillFormField = async (fieldName: string, value: string) => {
  const { screen } = await import('@testing-library/react')
  const { default: userEvent } = await import('@testing-library/user-event')
  
  const field = screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') })
  await userEvent.clear(field)
  await userEvent.type(field, value)
}

export const selectOption = async (selectName: string, optionText: string) => {
  const { screen } = await import('@testing-library/react')
  const { default: userEvent } = await import('@testing-library/user-event')
  
  const select = screen.getByRole('combobox', { name: new RegExp(selectName, 'i') })
  await userEvent.click(select)
  
  const option = screen.getByRole('option', { name: new RegExp(optionText, 'i') })
  await userEvent.click(option)
}

export const clickButton = async (buttonText: string) => {
  const { screen } = await import('@testing-library/react')
  const { default: userEvent } = await import('@testing-library/user-event')
  
  const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') })
  await userEvent.click(button)
}

// Error boundary testing
export const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Local storage mocks
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: 0,
    key: vi.fn()
  }
}

// Date testing helpers
export const mockDate = (dateString: string) => {
  const originalDate = Date
  const mockDate = new Date(dateString)
  
  global.Date = vi.fn(() => mockDate) as any
  global.Date.now = vi.fn(() => mockDate.getTime())
  global.Date.parse = originalDate.parse
  global.Date.UTC = originalDate.UTC
  
  return () => {
    global.Date = originalDate
  }
}