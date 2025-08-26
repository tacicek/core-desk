import { useState, useCallback, useRef, useEffect } from 'react';
import { useErrorReporting } from '@/components/ErrorBoundary';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export interface LoadingOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const useLoadingState = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const { reportError } = useErrorReporting();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
    retryCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T | null> => {
    const {
      onSuccess,
      onError,
      onFinally,
      timeout = 30000, // 30 seconds default timeout
      retries = 0,
      retryDelay = 1000
    } = options;

    const executeWithRetry = async (attempt: number): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Set up timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeout}ms`));
          }, timeout);
        });

        // Race between the async function and timeout
        const result = await Promise.race([asyncFn(), timeoutPromise]);

        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setData(result);
        onSuccess?.(result);
        retryCountRef.current = 0;
        return result;

      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if we should retry
        if (attempt < retries) {
          console.log(`Retrying in ${retryDelay}ms... (${attempt + 1}/${retries})`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return executeWithRetry(attempt + 1);
        }

        // No more retries, handle error
        setError(errorInstance);
        onError?.(errorInstance);
        
        // Report error for analytics
        await reportError(errorInstance, {
          context: 'useLoadingState',
          attempts: attempt + 1,
          timeout,
          retries
        });

        return null;
      } finally {
        setIsLoading(false);
        onFinally?.();
      }
    };

    return executeWithRetry(0);
  }, [reportError]);

  // Specialized version for async operations with automatic error handling
  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage = 'Ein Fehler ist aufgetreten',
    options: Omit<LoadingOptions, 'onError'> = {}
  ): Promise<T | null> => {
    return withLoading(asyncFn, {
      ...options,
      onError: (error) => {
        console.error(errorMessage, error);
        // You could add toast notification here
        options.onError?.(error);
      }
    });
  }, [withLoading]);

  // For simple boolean loading states
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (!loading) {
      retryCountRef.current = 0;
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    data,
    
    // Actions
    setIsLoading: setLoadingState,
    setError,
    setData,
    clearError,
    clearData,
    reset,
    
    // Async operations
    withLoading,
    executeAsync,
    
    // Computed values
    hasError: error !== null,
    hasData: data !== null,
    isEmpty: !isLoading && !error && !data,
    retryCount: retryCountRef.current
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = (initialStates: Record<string, boolean> = {}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(initialStates);
  const [errors, setErrors] = useState<Record<string, Error | null>>({});
  const { reportError } = useErrorReporting();

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
    if (!loading) {
      // Clear error when starting fresh
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const setError = useCallback((key: string, error: Error | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    if (error) {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T | null> => {
    try {
      setLoading(key, true);
      
      const result = await asyncFn();
      
      options.onSuccess?.(result);
      return result;
      
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      setError(key, errorInstance);
      options.onError?.(errorInstance);
      
      await reportError(errorInstance, { context: `useMultipleLoadingStates:${key}` });
      
      return null;
    } finally {
      setLoading(key, false);
      options.onFinally?.();
    }
  }, [setLoading, setError, reportError]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      setErrors(prev => ({ ...prev, [key]: null }));
    } else {
      setLoadingStates({});
      setErrors({});
    }
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const hasAnyError = Object.values(errors).some(Boolean);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    withLoading,
    reset,
    isLoading: (key: string) => loadingStates[key] || false,
    getError: (key: string) => errors[key] || null,
    hasError: (key: string) => Boolean(errors[key]),
    isAnyLoading,
    hasAnyError
  };
};

// Hook for debounced loading states (useful for search, etc.)
export const useDebouncedLoadingState = (delay = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      // Show loading immediately
      setDebouncedLoading(true);
    } else {
      // Delay hiding loading
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(false);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading: debouncedLoading,
    setIsLoading
  };
};