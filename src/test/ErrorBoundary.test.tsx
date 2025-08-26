import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary, useErrorReporting } from '@/components/ErrorBoundary'
import { ThrowError, createMockUser, createSuccessResponse, createErrorResponse } from '@/test/utils'
import React from 'react'

// Mock Supabase client
const mockSupabaseClient = {
  functions: {
    invoke: vi.fn()
  },
  auth: {
    getUser: vi.fn()
  }
}

// Mock the supabase integration
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

// Test component that uses error reporting hook
const TestComponentWithErrorReporting = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  const { reportError, isReporting } = useErrorReporting()
  
  const handleError = () => {
    if (shouldThrow) {
      throw new Error('Test error from component')
    }
    reportError(new Error('Manual error report'), {
      component: 'TestComponent',
      action: 'button_click'
    })
  }

  return (
    <div>
      <button onClick={handleError} disabled={isReporting}>
        {isReporting ? 'Reporting...' : 'Trigger Error'}
      </button>
      <span data-testid="reporting-status">
        {isReporting ? 'Reporting' : 'Ready'}
      </span>
    </div>
  )
}

describe('ErrorBoundary', () => {
  let consoleError: any

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleError = console.error
    console.error = vi.fn()
    
    // Setup default mock responses
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      createSuccessResponse(createMockUser())
    )
    mockSupabaseClient.functions.invoke.mockResolvedValue(
      createSuccessResponse({ success: true })
    )
  })

  afterEach(() => {
    console.error = consoleError
    vi.clearAllMocks()
  })

  describe('Error Catching', () => {
    it('should catch and display errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/Test error/i)).toBeInTheDocument()
    })

    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })

    it('should show error details when available', () => {
      const ErrorComponent = () => {
        throw new Error('Detailed error message with stack')
      }

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Detailed error message with stack/i)).toBeInTheDocument()
    })
  })

  describe('Error Reporting', () => {
    it('should report errors to Supabase edge function', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              error_message: 'Test error',
              error_type: 'component_error',
              component_stack: expect.any(String),
              severity: 'error'
            })
          })
        )
      })
    })

    it('should include browser and user context in error reports', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              browser_info: expect.objectContaining({
                userAgent: expect.any(String),
                url: expect.any(String),
                timestamp: expect.any(String)
              }),
              user_id: 'test-user-id'
            })
          })
        )
      })
    })

    it('should handle error reporting failures gracefully', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue(
        createErrorResponse('Failed to log error')
      )

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Should still show error UI even if reporting fails
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      
      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled()
      })
    })
  })

  describe('Recovery Mechanisms', () => {
    it('should provide retry functionality', async () => {
      const user = userEvent.setup()
      let shouldThrow = true
      
      const RecoverableComponent = () => {
        if (shouldThrow) {
          throw new Error('Recoverable error')
        }
        return <div>Component recovered!</div>
      }

      render(
        <ErrorBoundary>
          <RecoverableComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      
      // Fix the error condition
      shouldThrow = false
      
      const retryButton = screen.getByText(/Try again/i)
      await user.click(retryButton)

      expect(screen.getByText('Component recovered!')).toBeInTheDocument()
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })

    it('should reset error state on retry', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      
      const retryButton = screen.getByText(/Try again/i)
      await user.click(retryButton)

      // Error should persist since we didn't fix the underlying issue
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should track retry attempts', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const retryButton = screen.getByText(/Try again/i)
      
      // First retry
      await user.click(retryButton)
      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              context: expect.objectContaining({
                retry_count: 1
              })
            })
          })
        )
      })
    })
  })

  describe('Custom Error Information', () => {
    it('should accept custom error display component', () => {
      const CustomErrorDisplay = ({ error }: { error: Error }) => (
        <div data-testid="custom-error">
          Custom Error: {error.message}
        </div>
      )

      render(
        <ErrorBoundary fallback={CustomErrorDisplay}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-error')).toBeInTheDocument()
      expect(screen.getByText(/Custom Error: Test error/i)).toBeInTheDocument()
    })

    it('should provide error context to custom components', () => {
      const ContextAwareError = ({ error, errorInfo }: any) => (
        <div>
          <span data-testid="error-message">{error.message}</span>
          <span data-testid="component-stack">{errorInfo.componentStack}</span>
        </div>
      )

      render(
        <ErrorBoundary fallback={ContextAwareError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-message')).toHaveTextContent('Test error')
      expect(screen.getByTestId('component-stack')).toBeInTheDocument()
    })
  })

  describe('Error Severity Classification', () => {
    it('should classify network errors as warning', async () => {
      const NetworkError = () => {
        const error = new Error('Failed to fetch')
        error.name = 'NetworkError'
        throw error
      }

      render(
        <ErrorBoundary>
          <NetworkError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              severity: 'warning'
            })
          })
        )
      })
    })

    it('should classify syntax errors as critical', async () => {
      const SyntaxError = () => {
        const error = new Error('Unexpected token')
        error.name = 'SyntaxError'
        throw error
      }

      render(
        <ErrorBoundary>
          <SyntaxError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              severity: 'critical'
            })
          })
        )
      })
    })
  })
})

describe('useErrorReporting Hook', () => {
  beforeEach(() => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      createSuccessResponse(createMockUser())
    )
    mockSupabaseClient.functions.invoke.mockResolvedValue(
      createSuccessResponse({ success: true })
    )
  })

  describe('Manual Error Reporting', () => {
    it('should allow manual error reporting', async () => {
      const user = userEvent.setup()
      
      render(<TestComponentWithErrorReporting />)
      
      const button = screen.getByText('Trigger Error')
      await user.click(button)

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              error_message: 'Manual error report',
              error_type: 'manual_report',
              context: expect.objectContaining({
                component: 'TestComponent',
                action: 'button_click'
              })
            })
          })
        )
      })
    })

    it('should show reporting status', async () => {
      const user = userEvent.setup()
      
      // Delay the function invoke to test loading state
      mockSupabaseClient.functions.invoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(createSuccessResponse({ success: true })), 100))
      )
      
      render(<TestComponentWithErrorReporting />)
      
      const button = screen.getByText('Trigger Error')
      const status = screen.getByTestId('reporting-status')
      
      expect(status).toHaveTextContent('Ready')
      
      await user.click(button)
      
      expect(status).toHaveTextContent('Reporting')
      expect(button).toBeDisabled()

      await waitFor(() => {
        expect(status).toHaveTextContent('Ready')
        expect(button).not.toBeDisabled()
      })
    })

    it('should handle reporting errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.functions.invoke.mockResolvedValue(
        createErrorResponse('Network error')
      )
      
      render(<TestComponentWithErrorReporting />)
      
      const button = screen.getByText('Trigger Error')
      await user.click(button)

      // Should complete the reporting attempt even if it fails
      await waitFor(() => {
        expect(screen.getByTestId('reporting-status')).toHaveTextContent('Ready')
      })
    })
  })

  describe('Async Error Handling', () => {
    it('should handle promise rejections', async () => {
      const AsyncErrorComponent = () => {
        const { reportError } = useErrorReporting()
        
        React.useEffect(() => {
          Promise.reject(new Error('Async error')).catch(reportError)
        }, [reportError])
        
        return <div>Async component</div>
      }

      render(<AsyncErrorComponent />)

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              error_message: 'Async error',
              error_type: 'manual_report'
            })
          })
        )
      })
    })
  })

  describe('Context Enrichment', () => {
    it('should include additional context in error reports', async () => {
      const user = userEvent.setup()
      
      render(<TestComponentWithErrorReporting />)
      
      const button = screen.getByText('Trigger Error')
      await user.click(button)

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              context: expect.objectContaining({
                component: 'TestComponent',
                action: 'button_click'
              }),
              browser_info: expect.objectContaining({
                userAgent: expect.any(String),
                url: expect.any(String)
              })
            })
          })
        )
      })
    })

    it('should handle missing user context', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        createSuccessResponse(null)
      )
      
      render(<TestComponentWithErrorReporting />)
      
      const button = screen.getByText('Trigger Error')
      await user.click(button)

      await waitFor(() => {
        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
          'log-error',
          expect.objectContaining({
            body: expect.objectContaining({
              user_id: null
            })
          })
        )
      })
    })
  })
})

describe('Error Boundary Integration', () => {
  it('should work with React Router error boundaries', () => {
    const RouterErrorComponent = () => {
      throw new Error('Router navigation error')
    }

    render(
      <ErrorBoundary>
        <RouterErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/Router navigation error/i)).toBeInTheDocument()
  })

  it('should handle concurrent errors from multiple children', async () => {
    const MultiErrorComponent = () => {
      React.useEffect(() => {
        // Simulate multiple async errors
        setTimeout(() => { throw new Error('Async error 1') }, 10)
        setTimeout(() => { throw new Error('Async error 2') }, 20)
      }, [])
      
      throw new Error('Synchronous error')
    }

    render(
      <ErrorBoundary>
        <MultiErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    
    // Should capture at least the synchronous error
    await waitFor(() => {
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled()
    })
  })

  it('should preserve error boundaries hierarchy', () => {
    const InnerErrorComponent = () => {
      throw new Error('Inner error')
    }

    const OuterErrorComponent = () => (
      <ErrorBoundary>
        <InnerErrorComponent />
      </ErrorBoundary>
    )

    render(
      <ErrorBoundary>
        <OuterErrorComponent />
      </ErrorBoundary>
    )

    // Inner error boundary should catch the error
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/Inner error/i)).toBeInTheDocument()
  })
})