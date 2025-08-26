import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => Promise.resolve({ data: null, error: null })),
        delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
      }))
    }
  }))
}))

// Mock crypto for secure storage tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    randomUUID: vi.fn(() => 'test-uuid-123'),
    subtle: {
      generateKey: vi.fn(() => Promise.resolve('test-key')),
      encrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      decrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      importKey: vi.fn(() => Promise.resolve('test-key')),
      exportKey: vi.fn(() => Promise.resolve(new ArrayBuffer(32)))
    }
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Setup MSW server for API mocking
export const server = setupServer(
  // Mock Supabase endpoints
  http.post('https://test.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: [], error: null })
  }),
  
  http.get('https://test.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: [], error: null })
  }),

  // Mock n8n webhook
  http.post('*/functions/v1/n8n-webhook', () => {
    return HttpResponse.json({ success: true })
  }),

  // Mock OpenAI API
  http.post('https://api.openai.com/v1/*', () => {
    return HttpResponse.json({
      choices: [{
        message: {
          content: JSON.stringify({
            vendor_name: 'Test Vendor',
            amount: 100.50,
            confidence: 0.95
          })
        }
      }]
    })
  })
)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

// Close server after all tests
afterAll(() => server.close())

// Global test utilities
declare global {
  function renderWithProviders(ui: React.ReactElement): Promise<any>
  namespace globalThis {
    var renderWithProviders: (ui: React.ReactElement) => Promise<any>
  }
}

global.renderWithProviders = async (ui: React.ReactElement) => {
  const { render } = await import('@testing-library/react')
  const { BrowserRouter } = await import('react-router-dom')
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
}