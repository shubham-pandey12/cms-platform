/**
 * Form submission service
 * Handles API submission with error handling, retry logic, and tracking
 */

export interface FormSubmissionConfig {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface FormSubmissionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

export interface SubmissionTracking {
  formId: string;
  timestamp: Date;
  success: boolean;
  endpoint: string;
  error?: string;
}

// In-memory tracking (in production, this would be sent to analytics)
const submissionHistory: SubmissionTracking[] = [];

/**
 * Submit form data to an API endpoint
 */
export const submitForm = async (
  formData: Record<string, string | number | boolean>,
  config: FormSubmissionConfig
): Promise<FormSubmissionResult> => {
  const {
    endpoint,
    method = 'POST',
    headers = {},
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
  } = config;

  const formId = `form-${Date.now()}`;
  let lastError: Error | null = null;
  let lastStatusCode: number | undefined;

  // Prepare request body
  const body = JSON.stringify(formData);

  // Default headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Attempt submission with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint, {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatusCode = response.status;

      // Handle different status codes
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Track successful submission
        submissionHistory.push({
          formId,
          timestamp: new Date(),
          success: true,
          endpoint,
        });

        return {
          success: true,
          data,
          statusCode: response.status,
        };
      } else {
        // Handle error responses
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }

        lastError = new Error(errorMessage);

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          submissionHistory.push({
            formId,
            timestamp: new Date(),
            success: false,
            endpoint,
            error: errorMessage,
          });

          return {
            success: false,
            error: errorMessage,
            statusCode: response.status,
          };
        }

        // For server errors (5xx), retry if attempts remain
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }

        // Track failed submission
        submissionHistory.push({
          formId,
          timestamp: new Date(),
          success: false,
          endpoint,
          error: errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Handle network errors
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms`);
      }

      // Retry on network errors if attempts remain
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      // Track failed submission
      submissionHistory.push({
        formId,
        timestamp: new Date(),
        success: false,
        endpoint,
        error: lastError.message,
      });

      return {
        success: false,
        error: lastError.message,
        statusCode: lastStatusCode,
      };
    }
  }

  // This should never be reached, but TypeScript needs it
  return {
    success: false,
    error: lastError?.message || 'Submission failed',
    statusCode: lastStatusCode,
  };
};

/**
 * Get submission history (for debugging/analytics)
 */
export const getSubmissionHistory = (): SubmissionTracking[] => {
  return [...submissionHistory];
};

/**
 * Clear submission history
 */
export const clearSubmissionHistory = (): void => {
  submissionHistory.length = 0;
};

/**
 * Get submission statistics
 */
export const getSubmissionStats = (): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
} => {
  const total = submissionHistory.length;
  const successful = submissionHistory.filter((s) => s.success).length;
  const failed = total - successful;
  const successRate = total > 0 ? (successful / total) * 100 : 0;

  return {
    total,
    successful,
    failed,
    successRate: Math.round(successRate * 100) / 100,
  };
};

