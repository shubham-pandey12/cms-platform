/**
 * Action Handler Library
 * 
 * Handles execution of actions defined in widget configurations.
 * Supports navigate, scroll, trigger_api, and open_modal actions.
 */

import { Action, ApiCall, PageVariable } from '@/types/cms';
import { replaceVariables } from './variableReplacer';
import { isExternalApiCall } from './apiSecurity';
import { executeProxyJson } from './widgetApi';

export type AppNavigate = { push: (path: string) => void };

/**
 * Execute a navigate action
 */
export const executeNavigate = (action: Action, navigation?: AppNavigate): void => {
  if (action.type !== 'navigate' || !action.payload.url) {
    return;
  }

  if (action.payload.url.startsWith('http://') || action.payload.url.startsWith('https://')) {
    window.open(action.payload.url, '_blank');
    return;
  }

  const path = action.payload.url.startsWith('/') ? action.payload.url : `/${action.payload.url}`;

  if (navigation) {
    navigation.push(path);
    return;
  }
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
};

/**
 * Execute a scroll action
 */
export const executeScroll = (action: Action): void => {
  if (action.type !== 'scroll' || !action.payload.targetId) {
    return;
  }

  const element = document.getElementById(action.payload.targetId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Execute a trigger_api action
 */
export const executeTriggerApi = async (
  action: Action,
  apiCall: ApiCall | undefined,
  variables: PageVariable[] = []
): Promise<unknown> => {
  if (action.type !== 'trigger_api' || !action.payload.apiCallId || !apiCall) {
    return null;
  }

  try {
    const method = action.payload.method || apiCall.method || 'GET';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiCall.headers || {}),
    };

    // Convert variables to format expected by replaceVariables
    const variableMap = variables.map(v => ({ name: v.name, value: String(v.value) }));
    
    // Replace variables in endpoint
    let endpoint = replaceVariables(apiCall.endpoint, variableMap);

    // Replace variables in headers
    const processedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      processedHeaders[key] = replaceVariables(value, variableMap);
    });

    // Check if endpoint is external - external APIs MUST route through backend proxy
    const shouldUseProxy = isExternalApiCall(endpoint);

    // Prepare query params and body
    let queryParams: Record<string, string> | undefined;
    let body: string | undefined;

    // For GET requests, prepare query params
    if (method === 'GET' && apiCall.params) {
      queryParams = Object.fromEntries(
        Object.entries(apiCall.params).map(([key, value]) => [
          key,
          replaceVariables(String(value), variableMap)
        ])
      );
    }

    // For POST/PUT/PATCH, replace variables in body
    if (['POST', 'PUT', 'PATCH'].includes(method) && apiCall.params) {
      let bodyStr = JSON.stringify(apiCall.params);
      // Replace variables in JSON string (handle both quoted and unquoted)
      variableMap.forEach(v => {
        // Replace quoted variables: "{{VAR}}" -> "value"
        bodyStr = bodyStr.replace(new RegExp(`"\\{\\{${v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}"`, 'g'), `"${v.value.replace(/"/g, '\\"')}"`);
        // Replace unquoted variables: {{VAR}} -> value
        bodyStr = bodyStr.replace(new RegExp(`\\{\\{${v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'), v.value);
      });
      body = bodyStr;
    }

    if (shouldUseProxy) {
      // Route external API calls through backend proxy for security
      const proxyResponse = await executeProxyJson({
        endpoint,
        method,
        baseUrlKey: apiCall.baseUrlKey,
        credentialKey: apiCall.credentialKey,
        headers: processedHeaders,
        query: queryParams,
        body: body,
        timeoutMs: apiCall.timeout,
      }, `API Action ${apiCall.id || 'trigger'}`);

      return proxyResponse;
    }

    // For internal endpoints, build URL with params for GET requests
    let url = endpoint;
    if (method === 'GET' && queryParams) {
      const urlObj = new URL(endpoint, window.location.origin);
      Object.entries(queryParams).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });
      url = urlObj.toString();
    }

    // Only make direct fetch for internal endpoints (same origin as backend)
    const response = await fetch(url, {
      method,
      headers: processedHeaders,
      body,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing API action:', error);
    return null;
  }
};

/**
 * Execute an open_modal action
 */
export const executeOpenModal = (action: Action): void => {
  if (action.type !== 'open_modal' || !action.payload.targetId) {
    return;
  }

  // Dispatch a custom event to open the modal
  const event = new CustomEvent('openModal', { 
    detail: { modalId: action.payload.targetId } 
  });
  window.dispatchEvent(event);
};

/**
 * Execute an action based on its type
 */
export const executeAction = async (
  action: Action,
  apiCall?: ApiCall,
  variables: PageVariable[] = [],
  navigation?: AppNavigate
): Promise<unknown> => {
  switch (action.type) {
    case 'navigate':
      executeNavigate(action, navigation);
      return null;
    
    case 'scroll':
      executeScroll(action);
      return null;
    
    case 'trigger_api':
      return await executeTriggerApi(action, apiCall, variables);
    
    case 'open_modal':
      executeOpenModal(action);
      return null;
    
    default:
      console.warn(`Unknown action type: ${(action as Action).type}`);
      return null;
  }
};

/**
 * Get action handler function for a specific action type
 */
export const getActionHandler = (actionType: Action['type']) => {
  switch (actionType) {
    case 'navigate':
      return executeNavigate;
    case 'scroll':
      return executeScroll;
    case 'trigger_api':
      return executeTriggerApi;
    case 'open_modal':
      return executeOpenModal;
    default:
      return null;
  }
};
