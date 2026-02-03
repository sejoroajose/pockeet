/**
 * Custom Error Classes
 */

export class pockeetError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'pockeetError';
  }
}

export class WalletError extends pockeetError {
  constructor(message: string, details?: any) {
    super(message, 'WALLET_ERROR', details);
    this.name = 'WalletError';
  }
}

export class TransactionError extends pockeetError {
  constructor(message: string, details?: any) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}

export class BridgeError extends pockeetError {
  constructor(message: string, details?: any) {
    super(message, 'BRIDGE_ERROR', details);
    this.name = 'BridgeError';
  }
}

export class ValidationError extends pockeetError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends pockeetError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ENSError extends pockeetError {
  constructor(message: string, details?: any) {
    super(message, 'ENS_ERROR', details);
    this.name = 'ENSError';
  }
}

/**
 * Error Handler Functions
 */

/**
 * Parse and format error message
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof pockeetError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Handle common error patterns
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected';
    }
    
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    if (error.message.includes('network')) {
      return 'Network error, please try again';
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Log error to console (and potentially error tracking service)
 */
export function logError(error: unknown, context?: string) {
  const message = parseErrorMessage(error);
  
  console.error(`[pockeet Error${context ? ` - ${context}` : ''}]:`, {
    message,
    error,
    timestamp: new Date().toISOString(),
  });
  
  // TODO: Send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error);
  // }
}

/**
 * Handle async errors with try/catch wrapper
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  errorContext?: string
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    if (errorContext) {
      logError(error, errorContext);
    }
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries reached');
}

/**
 * Validate and throw if invalid
 */
export function validate(
  condition: boolean,
  message: string,
  ErrorClass: typeof pockeetError = ValidationError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

/**
 * Assert value is defined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string = 'Value is undefined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new ValidationError(message);
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Check if error is user rejection
 */
export function isUserRejection(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('user rejected') ||
      error.message.includes('User denied') ||
      error.message.includes('rejected')
    );
  }
  return false;
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('fetch failed')
    );
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (isUserRejection(error)) {
    return 'Transaction was cancelled';
  }
  
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return parseErrorMessage(error);
}

export default {
  pockeetError,
  WalletError,
  TransactionError,
  BridgeError,
  ValidationError,
  NetworkError,
  ENSError,
  parseErrorMessage,
  logError,
  handleAsync,
  retryWithBackoff,
  validate,
  assertDefined,
  safeJsonParse,
  isUserRejection,
  isNetworkError,
  getUserMessage,
};