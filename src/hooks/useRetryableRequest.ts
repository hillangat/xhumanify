import { useState, useCallback } from 'react';

interface RetryMetadata {
  isThrottling?: boolean;
  retryAfter?: number;
  fastFail?: boolean;
  retryable?: boolean;
}

interface UseRetryableRequestOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, delay: number) => void;
  onError?: (error: any, attempt: number) => void;
}

interface RetryableRequestState {
  isLoading: boolean;
  error: any;
  retryCount: number;
  isRetrying: boolean;
  nextRetryIn: number;
}

export function useRetryableRequest<T>(
  requestFn: () => Promise<T>,
  options: UseRetryableRequestOptions = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 5000, // 5 seconds base delay
    maxDelay = 60000, // 60 seconds max delay
    onRetry,
    onError
  } = options;

  const [state, setState] = useState<RetryableRequestState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
    nextRetryIn: 0
  });

  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
  }, [countdownTimer]);

  const startCountdown = useCallback((seconds: number, onComplete: () => void) => {
    clearTimer();
    
    setState(prev => ({ ...prev, nextRetryIn: seconds }));
    
    const timer = setInterval(() => {
      setState(prev => {
        const newTime = prev.nextRetryIn - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          setCountdownTimer(null);
          onComplete();
          return { ...prev, nextRetryIn: 0 };
        }
        return { ...prev, nextRetryIn: newTime };
      });
    }, 1000);
    
    setCountdownTimer(timer);
  }, [clearTimer]);

  const execute = useCallback(async (attemptNumber = 0): Promise<T> => {
    if (attemptNumber === 0) {
      setState({
        isLoading: true,
        error: null,
        retryCount: 0,
        isRetrying: false,
        nextRetryIn: 0
      });
      clearTimer();
    }

    try {
      const result = await requestFn();
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        isRetrying: false
      }));
      return result;
    } catch (error: any) {
      console.error(`Request attempt ${attemptNumber + 1} failed:`, error);
      
      // Parse error response if it's a JSON string
      let errorData = error;
      if (typeof error === 'string') {
        try {
          errorData = JSON.parse(error);
        } catch {
          // Keep original error if not JSON
        }
      }

      const metadata: RetryMetadata = errorData?.metadata || {};
      const isThrottling = metadata.isThrottling || 
                          errorData?.error?.includes('Throttling') || 
                          errorData?.error?.includes('Too many requests');

      // Check if we should retry
      const shouldRetry = attemptNumber < maxRetries && 
                         (metadata.retryable !== false) && 
                         (isThrottling || !metadata.fastFail);

      if (shouldRetry) {
        setState(prev => ({
          ...prev,
          retryCount: attemptNumber + 1,
          isRetrying: true,
          error: errorData
        }));

        // Calculate delay
        let delay: number;
        if (metadata.retryAfter) {
          delay = metadata.retryAfter * 1000; // Convert to milliseconds
        } else if (isThrottling) {
          delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
        } else {
          delay = Math.min(baseDelay * (attemptNumber + 1), maxDelay);
        }

        onRetry?.(attemptNumber + 1, delay);

        // Start countdown and retry
        return new Promise((resolve, reject) => {
          startCountdown(Math.ceil(delay / 1000), async () => {
            try {
              const result = await execute(attemptNumber + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          });
        });
      } else {
        // No more retries
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorData,
          isRetrying: false
        }));
        onError?.(errorData, attemptNumber + 1);
        throw errorData;
      }
    }
  }, [requestFn, maxRetries, baseDelay, maxDelay, onRetry, onError, clearTimer, startCountdown]);

  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  const cancel = useCallback(() => {
    clearTimer();
    setState(prev => ({
      ...prev,
      isLoading: false,
      isRetrying: false,
      nextRetryIn: 0
    }));
  }, [clearTimer]);

  return {
    execute,
    retry,
    cancel,
    ...state
  };
}

// Specialized hook for AI detection requests
export function useAIDetectionRequest() {
  return useRetryableRequest;
}

export default useRetryableRequest;