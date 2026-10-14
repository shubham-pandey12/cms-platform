/**
 * API Security Validation
 * Ensures only public-safe API configurations are allowed
 *
 * This module prevents users from accidentally exposing sensitive
 * authentication credentials in page configurations that are
 * stored client-side and potentially public.
 */

import { ApiCall } from '@/types/cms';
import { getApiBaseUrl } from './apiConfig';

/**
 * Check if a URL is absolute (starts with http://, https://, or //)
 */
const isAbsoluteUrl = (endpoint: string): boolean =>
  /^https?:\/\//i.test(endpoint) || endpoint.startsWith('//');

/**
 * Get the origin (protocol + host + port) from a URL
 */
const getOrigin = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch {
    return null;
  }
};

/**
 * Get the backend API origin for comparison
 */
const getBackendApiOrigin = (): string | null => {
  try {
    const baseUrl = getApiBaseUrl();
    if (isAbsoluteUrl(baseUrl)) {
      return getOrigin(baseUrl);
    }
    // If base URL is relative, try to construct from current location
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if an API endpoint is external (different origin from backend)
 * This is the shared utility function used across the application.
 * 
 * @param endpoint - The API endpoint to check
 * @returns true if the endpoint is external, false if internal
 */
export const isExternalApiCall = (endpoint: string): boolean => {
  const trimmedEndpoint = endpoint.trim();
  
  // Relative paths are always internal
  if (!isAbsoluteUrl(trimmedEndpoint)) {
    return false;
  }

  // Parse the endpoint URL
  let endpointOrigin: string | null;
  try {
    // If endpoint is absolute, get its origin
    if (isAbsoluteUrl(trimmedEndpoint)) {
      endpointOrigin = getOrigin(trimmedEndpoint);
    } else {
      // Relative path - resolve against backend base URL
      const baseWithTrailingSlash = `${getApiBaseUrl()}/`;
      const resolvedUrl = new URL(trimmedEndpoint, baseWithTrailingSlash);
      endpointOrigin = resolvedUrl.origin;
    }
  } catch {
    // If we can't parse it, assume it's external to be safe
    return true;
  }

  if (!endpointOrigin) {
    return true;
  }

  // Get backend origin for comparison
  const backendOrigin = getBackendApiOrigin();
  
  if (!backendOrigin) {
    // If we can't determine backend origin, assume external to be safe
    return true;
  }

  // Compare origins (case-insensitive, normalize ports)
  const normalizeOrigin = (origin: string): string => {
    try {
      const url = new URL(origin);
      // Normalize port: include default ports (80 for http, 443 for https)
      let port = url.port;
      if (!port) {
        port = url.protocol === 'https:' ? '443' : '80';
      }
      return `${url.protocol}//${url.hostname.toLowerCase()}:${port}`;
    } catch {
      return origin.toLowerCase();
    }
  };

  const normalizedEndpointOrigin = normalizeOrigin(endpointOrigin);
  const normalizedBackendOrigin = normalizeOrigin(backendOrigin);

  // If origins differ, it's external
  return normalizedEndpointOrigin !== normalizedBackendOrigin;
};

const FORBIDDEN_AUTH_TYPES = ['bearer', 'api_key', 'basic'] as const;

const SENSITIVE_HEADER_PATTERNS = [
  /authorization/i,
  /api[_-]?key/i,
  /auth[_-]?token/i,
  /bearer/i,
  /secret/i,
  /password/i,
  /x-api-key/i,
  /access[_-]?token/i,
];

// Headers that are generally safe for CORS and public APIs
const ALLOWED_HEADERS = [
  'content-type',
  'accept',
  'accept-language',
  'accept-encoding',
  'user-agent',
  'x-requested-with',
  'cache-control',
  'pragma',
] as const;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an API call configuration for security issues
 * @param apiCall - The API call configuration to validate
 * @returns Validation result with errors and warnings
 */
export const validateApiCallSecurity = (apiCall: ApiCall): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if this is an external API call
  const isExternal = isExternalApiCall(apiCall.endpoint);

  // External API calls are automatically routed through backend proxy
  // Warn user that proxy will be used automatically
  if (isExternal && !apiCall.useProxy) {
    warnings.push(
      `This endpoint points to an external API. External API calls are automatically routed through the backend proxy for security. ` +
      `The 'Use Proxy' option will be enabled automatically.`
    );
  }

  // Check auth configuration
  if (apiCall.auth && apiCall.auth.type !== 'none') {
    errors.push(
      `Authentication type '${apiCall.auth.type}' is not allowed. ` +
      `Only public APIs without authentication are permitted in page configurations. ` +
      `For authenticated APIs, use the backend proxy with a credentialKey configured server-side.`
    );
  }

  // For external APIs, ensure they're using proxy or warn that it will be automatic
  if (isExternal) {
    if (!apiCall.credentialKey && apiCall.auth && apiCall.auth.type !== 'none') {
      warnings.push(
        `External API detected. For authenticated external APIs, configure a credentialKey ` +
        `in the backend proxy settings and reference it here to keep credentials server-side.`
      );
    }
  }

  // Check headers for sensitive information
  if (apiCall.headers) {
    Object.entries(apiCall.headers).forEach(([headerName, headerValue]) => {
      const isSensitive = SENSITIVE_HEADER_PATTERNS.some(pattern => 
        pattern.test(headerName)
      );
      
      if (isSensitive) {
        errors.push(
          `Header '${headerName}' appears to contain sensitive authentication information. ` +
          `Remove this header to ensure API security. Use a backend proxy for authenticated endpoints.`
        );
      }

      // Check if header value contains sensitive-looking patterns
      if (headerValue && typeof headerValue === 'string') {
        // Check for token-like patterns (long alphanumeric strings)
        if (/^[A-Za-z0-9_-]{32,}$/.test(headerValue)) {
          warnings.push(
            `Header '${headerName}' contains a value that looks like an API token. ` +
            `Ensure this is not a secret credential.`
          );
        }

        // Check for Bearer pattern
        if (/bearer\s+[A-Za-z0-9_-]/i.test(headerValue)) {
          errors.push(
            `Header '${headerName}' contains a Bearer token. ` +
            `This is a security risk. Remove authentication from client-side API calls.`
          );
        }
      }
    });

    // Warn about non-standard headers that may cause CORS issues
    Object.keys(apiCall.headers).forEach(headerName => {
      const normalized = headerName.toLowerCase();
      if (!ALLOWED_HEADERS.includes(normalized as any)) {
        warnings.push(
          `Header '${headerName}' is non-standard and may cause CORS issues with public APIs. ` +
          `Only use standard safe headers for client-side requests.`
        );
      }
    });
  }

  // Check params for sensitive-looking values
  if (apiCall.params) {
    Object.entries(apiCall.params).forEach(([paramName, paramValue]) => {
      // Check for common sensitive parameter names
      if (/api[_-]?key|secret|token|password|auth/i.test(paramName)) {
        warnings.push(
          `Parameter '${paramName}' has a sensitive-sounding name. ` +
          `Ensure this parameter does not contain secret credentials.`
        );
      }

      // Check if param value looks like a token (not a template variable)
      if (
        paramValue && 
        typeof paramValue === 'string' && 
        !paramValue.includes('{{') && 
        /^[A-Za-z0-9_-]{32,}$/.test(paramValue)
      ) {
        warnings.push(
          `Parameter '${paramName}' contains a value that looks like an API token. ` +
          `Ensure this is not a secret credential.`
        );
      }
    });
  }

  // Check body for sensitive patterns
  if (apiCall.body && ['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
    try {
      const bodyObj = JSON.parse(apiCall.body);
      
      // Check for sensitive keys in body
      const checkObjectForSensitiveKeys = (obj: any, path = ''): void => {
        if (typeof obj !== 'object' || obj === null) return;
        
        Object.entries(obj).forEach(([key, value]) => {
          const fullPath = path ? `${path}.${key}` : key;
          
          if (/api[_-]?key|secret|token|password|auth/i.test(key)) {
            warnings.push(
              `Request body contains field '${fullPath}' with a sensitive-sounding name. ` +
              `Ensure this does not contain secret credentials.`
            );
          }

          if (typeof value === 'object') {
            checkObjectForSensitiveKeys(value, fullPath);
          }
        });
      };

      checkObjectForSensitiveKeys(bodyObj);
    } catch (e) {
      // Not valid JSON or some other issue - skip body validation
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Quick check if an API call is safe (no errors)
 * @param apiCall - The API call to check
 * @returns true if safe, false if has security errors
 */
export const isApiCallSafe = (apiCall: ApiCall): boolean => {
  const result = validateApiCallSecurity(apiCall);
  return result.isValid;
};

/**
 * Get a user-friendly error message for display
 * @param result - Validation result
 * @returns Formatted error message
 */
export const getSecurityErrorMessage = (result: ValidationResult): string => {
  if (result.isValid) {
    return '';
  }

  let message = 'API Security Violations:\n\n';
  result.errors.forEach((error, index) => {
    message += `${index + 1}. ${error}\n\n`;
  });

  if (result.warnings.length > 0) {
    message += '\nWarnings:\n\n';
    result.warnings.forEach((warning, index) => {
      message += `${index + 1}. ${warning}\n\n`;
    });
  }

  return message;
};

/**
 * Sanitize an API call by removing sensitive fields
 * This is a helper function to automatically clean up an API call
 * @param apiCall - The API call to sanitize
 * @returns A sanitized copy of the API call
 */
export const sanitizeApiCall = (apiCall: ApiCall): ApiCall => {
  const sanitized = { ...apiCall };

  // Remove auth
  if (sanitized.auth && sanitized.auth.type !== 'none') {
    sanitized.auth = { type: 'none' };
  }

  // Remove sensitive headers
  if (sanitized.headers) {
    const cleanHeaders: Record<string, string> = {};
    Object.entries(sanitized.headers).forEach(([key, value]) => {
      const isSensitive = SENSITIVE_HEADER_PATTERNS.some(pattern => 
        pattern.test(key)
      );
      if (!isSensitive) {
        cleanHeaders[key] = value;
      }
    });
    sanitized.headers = cleanHeaders;
  }

  return sanitized;
};
