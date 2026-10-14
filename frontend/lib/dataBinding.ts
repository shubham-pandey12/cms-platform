/**
 * Data Binding Library
 * 
 * Handles resolution of data bindings from API calls and variables
 * to widget configuration properties.
 */

import { DataBinding, ApiCall, PageVariable, WidgetInstance } from '@/types/cms';
import { getApiBaseUrl } from './apiConfig';
import { getNestedValue } from './templateEngine';
import { getAllWidgetVariables } from './widgetVariables';
import { evaluateSafeExpression } from './safeExpressionEvaluator';
import { replaceVariables } from './variableReplacer';
import { executeProxyJson } from './widgetApi';
import { isExternalApiCall } from './apiSecurity';

// Cache for API responses
const apiResponseCache: Record<string, unknown> = {};
// Cache for paginated responses (keyed by apiCallId:offset)
const paginatedResponseCache: Record<string, unknown> = {};
// Track timeout IDs for cache expiration to enable cleanup
const cacheTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const isAbsoluteUrl = (endpoint: string): boolean =>
  /^https?:\/\//i.test(endpoint) || endpoint.startsWith('//');

const buildRequestUrl = (endpoint: string): URL => {
  const trimmedEndpoint = endpoint.trim();

  if (isAbsoluteUrl(trimmedEndpoint)) {
    return new URL(trimmedEndpoint, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
  }

  const baseWithTrailingSlash = `${getApiBaseUrl()}/`;
  return new URL(trimmedEndpoint, baseWithTrailingSlash);
};

const parseJsonResponse = async (
  apiCallId: string,
  response: Response,
  requestUrl: string
): Promise<unknown> => {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const responseText = await response.text();
  const trimmed = responseText.trimStart();

  if (contentType.includes('json')) {
    try {
      return JSON.parse(responseText);
    } catch (error) {
      const snippet = responseText.substring(0, 200);
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      throw new Error(
        `Invalid JSON response from API ${apiCallId} (${requestUrl}): ${message}; body: ${snippet}`
      );
    }
  }

  const looksLikeHtml =
    trimmed.toLowerCase().startsWith('<!doctype html') || trimmed.startsWith('<html');

  const snippet = responseText.substring(0, 200).trim();
  const statusText = `${response.status} ${response.statusText}`.trim();

  if (looksLikeHtml) {
    throw new Error(
      `Received HTML from API ${apiCallId} at ${requestUrl} (status ${statusText || 'unknown'}). ` +
        `This often means the request hit the dev server instead of the API. ` +
        `Check NEXT_PUBLIC_API_BASE_URL and any proxy settings. Snippet: ${snippet || 'empty'}`
    );
  }

  throw new Error(
    `Non-JSON response from API ${apiCallId} at ${requestUrl} ` +
      `(status ${statusText || 'unknown'}): ${snippet || 'empty response'}`
  );
};

/**
 * Apply authentication to headers
 */
/**
 * Fetch API data and cache it
 */
export const fetchApiData = async (
  apiCall: ApiCall,
  variables: PageVariable[]
): Promise<unknown> => {
  // Check cache first (respecting cache settings)
  if (apiCall.cacheEnabled && apiResponseCache[apiCall.id]) {
    return apiResponseCache[apiCall.id];
  }

  try {
    // Merge page variables with widget variables (auto-binding from interactive widgets)
    const allVariables = [...variables, ...getAllWidgetVariables()];
    
    // Convert to format expected by replaceVariables
    const variableMap = allVariables.map(v => ({ name: v.name, value: String(v.value) }));
    
    // Replace variables in endpoint, headers, and params
    const endpoint = replaceVariables(apiCall.endpoint, variableMap);
    const headers: Record<string, string> = {};
    const params: Record<string, string> = {};

    // Replace variables in headers
    if (apiCall.headers) {
      Object.entries(apiCall.headers).forEach(([key, value]) => {
        headers[key] = replaceVariables(value, variableMap);
      });
    }

    // Replace variables in params
    if (apiCall.params) {
      Object.entries(apiCall.params).forEach(([key, value]) => {
        params[key] = replaceVariables(value, variableMap);
      });
    }

    // Prepare request body for POST/PUT/PATCH
    let body: string | undefined;
    if (apiCall.body && ['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
      body = replaceVariables(apiCall.body, variableMap);
      // Set Content-Type if not already set
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    if (!headers['Accept']) {
      headers['Accept'] = 'application/json';
    }

    // Automatically route external API calls through backend proxy for security
    // External APIs MUST always use proxy, regardless of useProxy flag
    // Internal API calls (same origin) can use direct fetch or opt-in to proxy
    const shouldUseProxy = isExternalApiCall(endpoint) || apiCall.useProxy;

    if (shouldUseProxy) {
      const proxyResponse = await executeProxyJson({
        endpoint,
        method: apiCall.method,
        baseUrlKey: apiCall.baseUrlKey,
        credentialKey: apiCall.credentialKey,
        headers,
        query: params,
        body,
        timeoutMs: apiCall.timeout,
      }, `API ${apiCall.id}`);
      // Cache the response
      if (apiCall.cacheEnabled) {
        apiResponseCache[apiCall.id] = proxyResponse;
        if (apiCall.cacheDuration) {
          const existingTimeout = cacheTimeouts.get(apiCall.id);
          if (existingTimeout) clearTimeout(existingTimeout);
          const timeoutId = setTimeout(() => {
            delete apiResponseCache[apiCall.id];
            cacheTimeouts.delete(apiCall.id);
          }, apiCall.cacheDuration * 1000);
          cacheTimeouts.set(apiCall.id, timeoutId);
        }
      }
      return proxyResponse;
    }

    // Build URL with params
    const url = buildRequestUrl(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Make real fetch call to API
    const controller = new AbortController();
    const timeout = apiCall.timeout || 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        method: apiCall.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await parseJsonResponse(apiCall.id, response, url.toString());
      
      // Cache the response
      if (apiCall.cacheEnabled) {
        apiResponseCache[apiCall.id] = data;
        if (apiCall.cacheDuration) {
          // Clear existing timeout if any
          const existingTimeout = cacheTimeouts.get(apiCall.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          // Set new timeout and track it
          const timeoutId = setTimeout(() => {
            delete apiResponseCache[apiCall.id];
            cacheTimeouts.delete(apiCall.id);
          }, apiCall.cacheDuration * 1000);
          cacheTimeouts.set(apiCall.id, timeoutId);
        }
      }
      
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(`Error fetching API data for ${apiCall.id}:`, error);
    throw error;
  }
};

/**
 * Apply transformation to a value
 */
const applyTransformation = (value: unknown, transform: DataBinding['transform']): unknown => {
  if (!transform) return value;

  try {
    switch (transform.type) {
      case 'format_date':
        // Simple date formatting - could be enhanced with a library like date-fns
        if (typeof value === 'string' || value instanceof Date) {
          const date = new Date(value);
          return date.toLocaleDateString();
        }
        return value;

      case 'format_number':
        if (typeof value === 'number') {
          const decimals = (transform.params?.decimals as number) || 2;
          return value.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
        return value;

      case 'format_currency':
        if (typeof value === 'number') {
          const currency = (transform.params?.currency as string) || 'USD';
          return value.toLocaleString(undefined, {
            style: 'currency',
            currency,
          });
        }
        return value;

      case 'concatenate':
        if (Array.isArray(value)) {
          const separator = (transform.params?.separator as string) || ' ';
          return value.join(separator);
        }
        return value;

      case 'substring':
        if (typeof value === 'string') {
          const start = (transform.params?.start as number) || 0;
          const end = transform.params?.end as number;
          return end !== undefined ? value.substring(start, end) : value.substring(start);
        }
        return value;

      case 'uppercase':
        if (typeof value === 'string') {
          return value.toUpperCase();
        }
        return value;

      case 'lowercase':
        if (typeof value === 'string') {
          return value.toLowerCase();
        }
        return value;

      case 'default_value':
        if (value === null || value === undefined) {
          return transform.params?.defaultValue;
        }
        return value;

      case 'custom':
        if (transform.customFunction) {
          // Safely evaluate custom function using restricted expression evaluator
          // This prevents arbitrary code execution by only allowing basic arithmetic operations
          try {
            return evaluateSafeExpression(transform.customFunction, value);
          } catch (err) {
            console.error('Error executing custom transformation:', err);
            return value;
          }
        }
        return value;

      default:
        return value;
    }
  } catch (error) {
    console.error('Error applying transformation:', error);
    return value;
  }
};

/**
 * Resolve a data binding value
 */
export const resolveDataBinding = (
  binding: DataBinding,
  apiResponses: Record<string, unknown>,
  variables: PageVariable[]
): unknown => {
  let value: unknown = null;

  if (binding.sourceType === 'variable') {
    const variable = variables.find(v => v.name === binding.sourceId);
    value = variable?.value || null;
  } else if (binding.sourceType === 'api_response') {
    const apiResponse = apiResponses[binding.sourceId];
    if (apiResponse) {
      // Use dot notation to get nested value
      value = getNestedValue(apiResponse, binding.sourcePath);
    }
  }

  // Apply default value if value is null/undefined
  if ((value === null || value === undefined) && binding.defaultValue !== undefined) {
    value = binding.defaultValue;
  }

  // Apply transformation if specified
  if (binding.transform) {
    value = applyTransformation(value, binding.transform);
  }

  return value;
};

/**
 * Apply data bindings to a widget instance
 * Returns a new config object with bindings applied
 */
export const applyDataBindings = (
  widgetInstance: WidgetInstance,
  apiResponses: Record<string, unknown>,
  variables: PageVariable[]
): Record<string, unknown> => {
  if (!widgetInstance.dataBindings || widgetInstance.dataBindings.length === 0) {
    return widgetInstance.config;
  }

  const resolvedConfig = { ...widgetInstance.config };

  widgetInstance.dataBindings.forEach(binding => {
    const value = resolveDataBinding(binding, apiResponses, variables);
    if (value !== null && value !== undefined) {
      resolvedConfig[binding.targetProp] = value;
    }
  });

  return resolvedConfig;
};

/**
 * Fetch all API calls for a page and return responses
 */
export const fetchAllApiData = async (
  apiCalls: ApiCall[],
  variables: PageVariable[]
): Promise<Record<string, unknown>> => {
  const responses: Record<string, unknown> = {};

  await Promise.all(
    apiCalls.map(async (apiCall) => {
      const data = await fetchApiData(apiCall, variables);
      if (data !== null) {
        responses[apiCall.id] = data;
      }
    })
  );

  return responses;
};

/**
 * Fetch API data with pagination support
 */
export const fetchApiDataPaginated = async (
  apiCall: ApiCall,
  variables: PageVariable[],
  offset: number,
  limit: number
): Promise<unknown> => {
  // Create cache key for this specific pagination request
  const cacheKey = `${apiCall.id}:${offset}:${limit}`;
  
  // Check cache first (respecting cache settings)
  if (apiCall.cacheEnabled && paginatedResponseCache[cacheKey]) {
    return paginatedResponseCache[cacheKey];
  }

  try {
    // Merge page variables with widget variables (auto-binding from interactive widgets)
    const allVariables = [...variables, ...getAllWidgetVariables()];
    
    // Convert to format expected by replaceVariables
    const variableMap = allVariables.map(v => ({ name: v.name, value: String(v.value) }));
    
    // Replace variables in endpoint, headers, and params
    const endpoint = replaceVariables(apiCall.endpoint, variableMap);
    const headers: Record<string, string> = {};
    const params: Record<string, string> = { ...apiCall.params };

    // Replace variables in headers
    if (apiCall.headers) {
      Object.entries(apiCall.headers).forEach(([key, value]) => {
        headers[key] = replaceVariables(value, variableMap);
      });
    }

    // Replace variables in params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        params[key] = replaceVariables(value, variableMap);
      });
    }

    // Add pagination parameters
    params.offset = String(offset);
    params.limit = String(limit);

    // Build URL with params
    const url = buildRequestUrl(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Prepare request body for POST/PUT/PATCH
    let body: string | undefined;
    if (apiCall.body && ['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
      body = replaceVariables(apiCall.body, variableMap);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    if (!headers['Accept']) {
      headers['Accept'] = 'application/json';
    }

    // Automatically route external API calls through backend proxy for security
    // External APIs MUST always use proxy, regardless of useProxy flag
    // Internal API calls (same origin) can use direct fetch or opt-in to proxy
    const shouldUseProxy = isExternalApiCall(endpoint) || apiCall.useProxy;

    if (shouldUseProxy) {
      const proxyResponse = await executeProxyJson({
        endpoint,
        method: apiCall.method,
        baseUrlKey: apiCall.baseUrlKey,
        credentialKey: apiCall.credentialKey,
        headers,
        query: params,
        body,
        timeoutMs: apiCall.timeout,
      }, `API ${apiCall.id} (paginated)`);
      // Cache the response
      if (apiCall.cacheEnabled) {
        paginatedResponseCache[cacheKey] = proxyResponse;
        if (apiCall.cacheDuration) {
          // Clear existing timeout if any
          const existingTimeout = cacheTimeouts.get(cacheKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          // Set new timeout and track it
          const timeoutId = setTimeout(() => {
            delete paginatedResponseCache[cacheKey];
            cacheTimeouts.delete(cacheKey);
          }, apiCall.cacheDuration * 1000);
          cacheTimeouts.set(cacheKey, timeoutId);
        }
      }
      return proxyResponse;
    }

    // Make real fetch call to API (only for internal endpoints)
    const controller = new AbortController();
    const timeout = apiCall.timeout || 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        method: apiCall.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await parseJsonResponse(apiCall.id, response, url.toString());
      
      // Cache the response
      if (apiCall.cacheEnabled) {
        paginatedResponseCache[cacheKey] = data;
        if (apiCall.cacheDuration) {
          // Clear existing timeout if any
          const existingTimeout = cacheTimeouts.get(cacheKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          // Set new timeout and track it
          const timeoutId = setTimeout(() => {
            delete paginatedResponseCache[cacheKey];
            cacheTimeouts.delete(cacheKey);
          }, apiCall.cacheDuration * 1000);
          cacheTimeouts.set(cacheKey, timeoutId);
        }
      }
      
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(`Error fetching paginated API data for ${apiCall.id}:`, error);
    throw error;
  }
};

/**
 * Append paginated data to existing data array
 * Handles merging arrays from nested response paths
 */
export const appendPaginatedData = (
  existingData: unknown,
  newData: unknown,
  dataPath: string
): unknown => {
  // Get the array from the new data using the path
  const newArray = getNestedValue(newData, dataPath);
  
  if (!Array.isArray(newArray)) {
    console.warn(`Expected array at path ${dataPath}, got:`, typeof newArray);
    return existingData;
  }

  // If existing data is an array, append to it
  if (Array.isArray(existingData)) {
    return [...existingData, ...newArray];
  }

  // If existing data is not an array, return the new array
  return newArray;
};

/**
 * Clear API response cache
 */
export const clearApiCache = (apiCallId?: string): void => {
  if (apiCallId) {
    // Clear timeout if exists
    const timeout = cacheTimeouts.get(apiCallId);
    if (timeout) {
      clearTimeout(timeout);
      cacheTimeouts.delete(apiCallId);
    }
    delete apiResponseCache[apiCallId];
    // Clear all paginated cache entries for this API call
    Object.keys(paginatedResponseCache).forEach(key => {
      if (key.startsWith(`${apiCallId}:`)) {
        const paginatedTimeout = cacheTimeouts.get(key);
        if (paginatedTimeout) {
          clearTimeout(paginatedTimeout);
          cacheTimeouts.delete(key);
        }
        delete paginatedResponseCache[key];
      }
    });
  } else {
    // Clear all timeouts
    cacheTimeouts.forEach(timeout => clearTimeout(timeout));
    cacheTimeouts.clear();
    Object.keys(apiResponseCache).forEach(key => delete apiResponseCache[key]);
    Object.keys(paginatedResponseCache).forEach(key => delete paginatedResponseCache[key]);
  }
};
