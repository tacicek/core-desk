import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  useLoadingState, 
  useAsyncOperation, 
  useDebouncedLoading,
  useMultipleLoadingStates 
} from '@/hooks/useLoadingState'
import { LoadingSpinner, LoadingOverlay, LoadingPage, LoadingButton } from '@/components/ui/LoadingSpinner'

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Basic Loading State', () => {
    it('should initialize with loading false', () => {
      const { result } = renderHook(() => useLoadingState())
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useLoadingState())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
    })

    it('should set error state', () => {
      const { result } = renderHook(() => useLoadingState())
      const testError = new Error('Test error')
      
      act(() => {
        result.current.setError(testError)
      })
      
      expect(result.current.error).toBe(testError)
    })

    it('should reset state', () => {
      const { result } = renderHook(() => useLoadingState())
      
      act(() => {
        result.current.setLoading(true)
        result.current.setError(new Error('Test'))
      })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).not.toBeNull()
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout after specified duration', () => {
      const onTimeout = vi.fn()
      const { result } = renderHook(() => 
        useLoadingState({ timeout: 5000, onTimeout })
      )
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      
      expect(onTimeout).toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })

    it('should not timeout if loading completes early', () => {
      const onTimeout = vi.fn()
      const { result } = renderHook(() => 
        useLoadingState({ timeout: 5000, onTimeout })
      )
      
      act(() => {
        result.current.setLoading(true)
      })
      
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      
      act(() => {
        result.current.setLoading(false)
      })
      
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      
      expect(onTimeout).not.toHaveBeenCalled()
    })

    it('should clear timeout on unmount', () => {
      const onTimeout = vi.fn()
      const { result, unmount } = renderHook(() => 
        useLoadingState({ timeout: 5000, onTimeout })
      )
      
      act(() => {
        result.current.setLoading(true)
      })
      
      unmount()
      
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      
      expect(onTimeout).not.toHaveBeenCalled()
    })
  })

  describe('Error Reporting Integration', () => {
    it('should report errors when onError callback provided', () => {
      const onError = vi.fn()
      const { result } = renderHook(() => 
        useLoadingState({ onError })
      )
      
      const testError = new Error('Test error')
      
      act(() => {
        result.current.setError(testError)
      })
      
      expect(onError).toHaveBeenCalledWith(testError)
    })

    it('should include loading context in error reports', () => {
      const onError = vi.fn()
      const { result } = renderHook(() => 
        useLoadingState({ onError })
      )
      
      act(() => {
        result.current.setLoading(true)
      })
      
      const testError = new Error('Test error')
      
      act(() => {
        result.current.setError(testError)
      })
      
      expect(onError).toHaveBeenCalledWith(testError)
    })
  })
})

describe('useAsyncOperation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Async Operation Execution', () => {
    it('should execute async operation and track loading state', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success')
      const { result } = renderHook(() => useAsyncOperation(asyncFn))
      
      expect(result.current.isLoading).toBe(false)
      
      act(() => {
        result.current.execute()
      })
      
      expect(result.current.isLoading).toBe(true)
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBe('success')
      expect(result.current.error).toBeNull()
    })

    it('should handle async operation errors', async () => {
      const error = new Error('Async error')
      const asyncFn = vi.fn().mockRejectedValue(error)
      const { result } = renderHook(() => useAsyncOperation(asyncFn))
      
      act(() => {
        result.current.execute()
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(error)
      expect(result.current.data).toBeNull()
    })

    it('should pass arguments to async function', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success')
      const { result } = renderHook(() => useAsyncOperation(asyncFn))
      
      act(() => {
        result.current.execute('arg1', 'arg2')
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let attempts = 0
      const asyncFn = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Retry error'))
        }
        return Promise.resolve('success')
      })
      
      const { result } = renderHook(() => 
        useAsyncOperation(asyncFn, { maxRetries: 3, retryDelay: 1000 })
      )
      
      act(() => {
        result.current.execute()
      })
      
      // First attempt fails
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.retryCount).toBe(1)
      expect(result.current.isLoading).toBe(true)
      
      // Wait for retry delay and second attempt
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.retryCount).toBe(2)
      
      // Wait for retry delay and third attempt (success)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBe('success')
      expect(result.current.retryCount).toBe(2)
    })

    it('should give up after max retries', async () => {
      const asyncFn = vi.fn().mockRejectedValue(new Error('Persistent error'))
      const { result } = renderHook(() => 
        useAsyncOperation(asyncFn, { maxRetries: 2, retryDelay: 1000 })
      )
      
      act(() => {
        result.current.execute()
      })
      
      // Initial attempt + 2 retries
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await vi.runAllTimersAsync()
        })
        
        if (i < 2) {
          act(() => {
            vi.advanceTimersByTime(1000)
          })
        }
      }
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error?.message).toBe('Persistent error')
      expect(result.current.retryCount).toBe(2)
    })

    it('should allow manual retry', async () => {
      const asyncFn = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('success')
      
      const { result } = renderHook(() => useAsyncOperation(asyncFn))
      
      // First execution fails
      act(() => {
        result.current.execute()
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.error).toBeTruthy()
      
      // Manual retry succeeds
      act(() => {
        result.current.retry()
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      expect(result.current.data).toBe('success')
      expect(result.current.error).toBeNull()
    })
  })

  describe('Cancellation', () => {
    it('should cancel ongoing operations', async () => {
      let resolveFn: (value: string) => void
      const asyncFn = vi.fn().mockImplementation(() => 
        new Promise<string>(resolve => { resolveFn = resolve })
      )
      
      const { result } = renderHook(() => useAsyncOperation(asyncFn))
      
      act(() => {
        result.current.execute()
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        result.current.cancel()
      })
      
      expect(result.current.isLoading).toBe(false)
      
      // Resolve the promise after cancellation
      act(() => {
        resolveFn!('late success')
      })
      
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      
      // Should not update state after cancellation
      expect(result.current.data).toBeNull()
    })
  })
})

describe('useDebouncedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce loading state changes', () => {
    const { result } = renderHook(() => useDebouncedLoading(500))
    
    // Rapidly toggle loading state
    act(() => {
      result.current.setLoading(true)
    })
    
    act(() => {
      result.current.setLoading(false)
    })
    
    act(() => {
      result.current.setLoading(true)
    })
    
    // Should not show loading immediately
    expect(result.current.debouncedLoading).toBe(false)
    
    // Wait for debounce delay
    act(() => {
      vi.advanceTimersByTime(500)
    })
    
    expect(result.current.debouncedLoading).toBe(true)
  })

  it('should immediately show false when loading stops', () => {
    const { result } = renderHook(() => useDebouncedLoading(500))
    
    act(() => {
      result.current.setLoading(true)
    })
    
    act(() => {
      vi.advanceTimersByTime(500)
    })
    
    expect(result.current.debouncedLoading).toBe(true)
    
    // Should immediately become false
    act(() => {
      result.current.setLoading(false)
    })
    
    expect(result.current.debouncedLoading).toBe(false)
  })
})

describe('useMultipleLoadingStates', () => {
  it('should manage multiple named loading states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates())
    
    act(() => {
      result.current.setLoading('save', true)
      result.current.setLoading('delete', true)
    })
    
    expect(result.current.isLoading('save')).toBe(true)
    expect(result.current.isLoading('delete')).toBe(true)
    expect(result.current.isAnyLoading()).toBe(true)
    
    act(() => {
      result.current.setLoading('save', false)
    })
    
    expect(result.current.isLoading('save')).toBe(false)
    expect(result.current.isLoading('delete')).toBe(true)
    expect(result.current.isAnyLoading()).toBe(true)
    
    act(() => {
      result.current.setLoading('delete', false)
    })
    
    expect(result.current.isAnyLoading()).toBe(false)
  })

  it('should get list of active loading states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates())
    
    act(() => {
      result.current.setLoading('save', true)
      result.current.setLoading('fetch', true)
    })
    
    const activeStates = result.current.getActiveStates()
    expect(activeStates).toEqual(['save', 'fetch'])
  })
})

describe('LoadingSpinner Component', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('should render with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8') // lg size classes
  })

  it('should render with custom color', () => {
    render(<LoadingSpinner color="red" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner.querySelector('svg')).toHaveClass('text-red-600')
  })

  it('should show text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })
})

describe('LoadingOverlay Component', () => {
  it('should render overlay when visible', () => {
    render(
      <LoadingOverlay visible={true}>
        <div>Content</div>
      </LoadingOverlay>
    )
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should not render overlay when not visible', () => {
    render(
      <LoadingOverlay visible={false}>
        <div>Content</div>
      </LoadingOverlay>
    )
    
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    render(
      <LoadingOverlay visible={true} message="Processing...">
        <div>Content</div>
      </LoadingOverlay>
    )
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
})

describe('LoadingPage Component', () => {
  it('should render full page loading state', () => {
    render(<LoadingPage />)
    
    expect(screen.getByText('CoreDesk')).toBeInTheDocument()
    expect(screen.getByText('CoreDesk wird geladen...')).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    render(<LoadingPage text="Initializing application..." />)
    
    expect(screen.getByText('Initializing application...')).toBeInTheDocument()
  })
})

describe('LoadingButton Component', () => {
  it('should render button with loading state', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    
    render(
      <LoadingButton onClick={onClick} isLoading={true}>
        Save
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Wird geladen...')).toBeInTheDocument()
    
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should render normal button when not loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    
    render(
      <LoadingButton onClick={onClick} isLoading={false}>
        Save
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    expect(screen.queryByText('Wird geladen...')).not.toBeInTheDocument()
    
    await user.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it('should show custom loading text', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Saving...">
        Save
      </LoadingButton>
    )
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.queryByText('Save')).not.toBeInTheDocument()
  })
})