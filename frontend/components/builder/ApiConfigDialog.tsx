'use client';

import React, { useState, useEffect } from 'react';
import { ApiCall, PageVariable } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { validateApiCallSecurity } from '@/lib/apiSecurity';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { KeyValueEditor, KeyValuePair } from './KeyValueEditor';
import { JsonBodyEditor } from './JsonBodyEditor';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiCall?: ApiCall | null;
  onSave: (apiCall: Omit<ApiCall, 'id'> | ApiCall) => void;
  variables?: PageVariable[];
  onTest?: (apiCall: ApiCall) => Promise<unknown>;
}

export const ApiConfigDialog: React.FC<ApiConfigDialogProps> = ({
  open,
  onOpenChange,
  apiCall,
  onSave,
  variables = [],
  onTest,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; data?: unknown; error?: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState<ApiCall['method']>('GET');
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [body, setBody] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'api_key' | 'basic'>('none');
  const [authToken, setAuthToken] = useState('');
  const [authApiKey, setAuthApiKey] = useState('');
  const [authApiKeyHeader, setAuthApiKeyHeader] = useState('X-API-Key');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [timeout, setTimeout] = useState(30000);
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [cacheDuration, setCacheDuration] = useState(300);
  const [useProxy, setUseProxy] = useState(false);
  const [credentialKey, setCredentialKey] = useState('');
  const [baseUrlKey, setBaseUrlKey] = useState('');

  // Helper to check if endpoint is external
  const checkIfExternal = (endpointUrl: string): boolean => {
    const trimmed = endpointUrl.trim();
    if (!trimmed) return false;
    
    // Relative paths are internal
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('//')) {
      return false;
    }

    try {
      const url = new URL(trimmed);
      const endpointOrigin = url.origin.toLowerCase();
      
      const envBase = getApiBaseUrl();
      let backendOrigin: string;
      try {
        const backendUrl = new URL(envBase);
        backendOrigin = backendUrl.origin.toLowerCase();
      } catch {
        if (typeof window !== 'undefined') {
          backendOrigin = window.location.origin.toLowerCase();
        } else {
          return true;
        }
      }

      // Normalize ports for comparison
      const normalizeOrigin = (origin: string): string => {
        try {
          const u = new URL(origin);
          let port = u.port;
          if (!port) {
            port = u.protocol === 'https:' ? '443' : '80';
          }
          return `${u.protocol}//${u.hostname}:${port}`;
        } catch {
          return origin;
        }
      };

      return normalizeOrigin(endpointOrigin) !== normalizeOrigin(backendOrigin);
    } catch {
      return false;
    }
  };

  const isExternalEndpoint = checkIfExternal(endpoint);

  useEffect(() => {
    if (apiCall) {
      setName(apiCall.name);
      setEndpoint(apiCall.endpoint);
      setMethod(apiCall.method);
      setHeaders(
        Object.entries(apiCall.headers || {}).map(([key, value]) => ({ key, value }))
      );
      setParams(
        Object.entries(apiCall.params || {}).map(([key, value]) => ({ key, value }))
      );
      setBody(apiCall.body || '');
      setAuthType(apiCall.auth?.type || 'none');
      setAuthToken(apiCall.auth?.token || '');
      setAuthApiKey(apiCall.auth?.apiKey || '');
      setAuthApiKeyHeader(apiCall.auth?.apiKeyHeader || 'X-API-Key');
      setAuthUsername(apiCall.auth?.username || '');
      setAuthPassword(apiCall.auth?.password || '');
      setTimeout(apiCall.timeout || 30000);
      setCacheEnabled(apiCall.cacheEnabled || false);
      setCacheDuration(apiCall.cacheDuration || 300);
      // Auto-enable proxy for external endpoints
      const endpointIsExternal = checkIfExternal(apiCall.endpoint);
      setUseProxy(apiCall.useProxy || endpointIsExternal);
      setCredentialKey(apiCall.credentialKey || '');
      setBaseUrlKey(apiCall.baseUrlKey || '');
    } else {
      // Reset form
      setName('');
      setEndpoint('');
      setMethod('GET');
      setHeaders([]);
      setParams([]);
      setBody('');
      setAuthType('none');
      setAuthToken('');
      setAuthApiKey('');
      setAuthApiKeyHeader('X-API-Key');
      setAuthUsername('');
      setAuthPassword('');
      setTimeout(30000);
      setCacheEnabled(false);
      setCacheDuration(300);
      setUseProxy(false);
      setCredentialKey('');
      setBaseUrlKey('');
    }
    setTestResult(null);
    setActiveTab('general');
  }, [apiCall, open]);

  // Auto-enable proxy when endpoint becomes external
  useEffect(() => {
    if (endpoint) {
      const endpointIsExternal = checkIfExternal(endpoint);
      if (endpointIsExternal && !useProxy) {
        setUseProxy(true);
      }
    }
  }, [endpoint, useProxy]);

  const handleSave = () => {
    if (!name || !endpoint) {
      toast.error(copy.builder.apiConfig.toast.fillRequired);
      return;
    }

    const headersObj: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key) headersObj[h.key] = h.value;
    });

    const paramsObj: Record<string, string> = {};
    params.forEach((p) => {
      if (p.key) paramsObj[p.key] = p.value;
    });

    // Force auth to none for security
    const auth = authType === 'none' || authType === undefined ? { type: 'none' as const } : {
      type: authType,
      token: authType === 'bearer' ? authToken : undefined,
      apiKey: authType === 'api_key' ? authApiKey : undefined,
      apiKeyHeader: authType === 'api_key' ? authApiKeyHeader : undefined,
      username: authType === 'basic' ? authUsername : undefined,
      password: authType === 'basic' ? authPassword : undefined,
    };

    const apiCallData: Omit<ApiCall, 'id'> = {
      name,
      endpoint,
      method,
      headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      params: Object.keys(paramsObj).length > 0 ? paramsObj : undefined,
      body: body.trim() ? body : undefined,
      auth,
      timeout: timeout !== 30000 ? timeout : undefined,
      cacheEnabled: cacheEnabled ? true : undefined,
      cacheDuration: cacheEnabled && cacheDuration !== 300 ? cacheDuration : undefined,
      useProxy: useProxy || undefined,
      credentialKey: credentialKey.trim() || undefined,
      baseUrlKey: baseUrlKey.trim() || undefined,
    };

    // Validate API security before saving
    const validation = validateApiCallSecurity(apiCallData as ApiCall);
    
    if (!validation.isValid) {
      // Show all errors
      validation.errors.forEach(error => {
        toast.error(copy.builder.apiConfig.toast.securityViolation, { 
          description: error,
          duration: 8000,
        });
      });
      return; // Block save if there are security errors
    }

    // Show warnings (but allow save)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast.warning(copy.builder.apiConfig.toast.securityWarning, { 
          description: warning,
          duration: 6000,
        });
      });
    }

    if (apiCall) {
      onSave({ ...apiCallData, id: apiCall.id });
    } else {
      onSave(apiCallData);
    }

    toast.success(copy.builder.apiConfig.toast.saved);
    onOpenChange(false);
  };

  const handleTest = async () => {
    if (!onTest) {
      toast.info(copy.builder.apiConfig.toast.testNotImplemented);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const headersObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headersObj[h.key] = h.value;
      });

      const paramsObj: Record<string, string> = {};
      params.forEach((p) => {
        if (p.key) paramsObj[p.key] = p.value;
      });

      const auth = authType === 'none' ? undefined : {
        type: authType,
        token: authType === 'bearer' ? authToken : undefined,
        apiKey: authType === 'api_key' ? authApiKey : undefined,
        apiKeyHeader: authType === 'api_key' ? authApiKeyHeader : undefined,
        username: authType === 'basic' ? authUsername : undefined,
        password: authType === 'basic' ? authPassword : undefined,
      };

      const testApiCall: ApiCall = {
        id: apiCall?.id || 'test',
        name,
        endpoint,
        method,
        headers: headersObj,
        params: paramsObj,
        body: body.trim() ? body : undefined,
        auth,
        timeout,
      };

      const result = await onTest(testApiCall);
      setTestResult({ success: true, data: result });
      toast.success(copy.builder.apiConfig.toast.testSuccess);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error(copy.builder.apiConfig.toast.testFailed);
    } finally {
      setIsTesting(false);
    }
  };

  const variableNames = variables.map((v) => v.name);
  const showBodyTab = ['POST', 'PUT', 'PATCH'].includes(method);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{apiCall ? copy.builder.apiConfig.editTitle : copy.builder.apiConfig.addTitle}</DialogTitle>
          <DialogDescription>
            Configure your API endpoint with authentication, headers, and request body.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="body" disabled={!showBodyTab}>
              Body
              {!showBodyTab && <Badge className="ml-1 h-4" variant="secondary">N/A</Badge>}
            </TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pt-4">
            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.builder.apiConfig.namePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={(value: ApiCall['method']) => setMethod(value)}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">
                  Endpoint URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder={copy.builder.apiConfig.urlPlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  Use {`{{VARIABLE_NAME}}`} to insert dynamic values
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={!endpoint || isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Test API
                  </Button>
                  {testResult && (
                    <Badge variant={testResult.success ? 'default' : 'destructive'}>
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Success
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              {testResult && testResult.data && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground mb-2">Response Preview:</Label>
                  <pre className="text-xs overflow-auto max-h-40 mt-2">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            {/* Authentication Tab */}
            <TabsContent value="auth" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="authType">Authentication Type</Label>
                <Select
                  value={authType}
                  onValueChange={(value: typeof authType) => setAuthType(value)}
                >
                  <SelectTrigger id="authType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authType === 'bearer' && (
                <div className="space-y-2">
                  <Label htmlFor="authToken">Bearer Token</Label>
                  <Input
                    id="authToken"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder={copy.builder.apiConfig.bearerPlaceholder}
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.builder.apiConfig.bearerTokenHint}
                  </p>
                </div>
              )}

              {authType === 'api_key' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="authApiKeyHeader">API Key Header Name</Label>
                    <Input
                      id="authApiKeyHeader"
                      value={authApiKeyHeader}
                      onChange={(e) => setAuthApiKeyHeader(e.target.value)}
                      placeholder={copy.builder.apiConfig.apiKeyHeaderPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authApiKey">API Key Value</Label>
                    <Input
                      id="authApiKey"
                      value={authApiKey}
                      onChange={(e) => setAuthApiKey(e.target.value)}
                      placeholder={copy.builder.apiConfig.apiKeyValuePlaceholder}
                      type="password"
                    />
                  </div>
                </>
              )}

              {authType === 'basic' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="authUsername">Username</Label>
                    <Input
                      id="authUsername"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder={copy.builder.apiConfig.usernamePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authPassword">Password</Label>
                    <Input
                      id="authPassword"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder={copy.builder.apiConfig.passwordPlaceholder}
                      type="password"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Headers Tab */}
            <TabsContent value="headers" className="mt-0">
              <KeyValueEditor
                pairs={headers}
                onChange={setHeaders}
                keyPlaceholder={copy.builder.apiConfig.headerNamePlaceholder}
                valuePlaceholder={copy.builder.apiConfig.headerValuePlaceholder}
                showPresets={true}
                allowVariables={true}
                variables={variableNames}
              />
            </TabsContent>

            {/* Query Params Tab */}
            <TabsContent value="params" className="mt-0">
              <KeyValueEditor
                pairs={params}
                onChange={setParams}
                keyPlaceholder={copy.builder.apiConfig.paramNamePlaceholder}
                valuePlaceholder={copy.builder.apiConfig.paramValuePlaceholder}
                showPresets={false}
                allowVariables={true}
                variables={variableNames}
              />
            </TabsContent>

            {/* Request Body Tab */}
            <TabsContent value="body" className="mt-0">
              <JsonBodyEditor
                value={body}
                onChange={setBody}
                allowVariables={true}
                variables={variableNames}
              />
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (milliseconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value) || 30000)}
                  placeholder={copy.builder.apiConfig.timeoutPlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  Request will fail if it takes longer than this
                </p>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="cacheEnabled">Enable Caching</Label>
                  <p className="text-xs text-muted-foreground">
                    Cache API responses to improve performance
                  </p>
                </div>
                <Switch
                  id="cacheEnabled"
                  checked={cacheEnabled}
                  onCheckedChange={setCacheEnabled}
                />
              </div>

              {cacheEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="cacheDuration">Cache Duration (seconds)</Label>
                  <Input
                    id="cacheDuration"
                    type="number"
                    value={cacheDuration}
                    onChange={(e) => setCacheDuration(parseInt(e.target.value) || 300)}
                    placeholder={copy.builder.apiConfig.cacheDurationPlaceholder}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cached responses will be used for this duration
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="proxy" className="space-y-4 mt-0">
              {isExternalEndpoint && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      External API
                    </Badge>
                  </div>
                  <p>
                    This endpoint points to an external API. External API calls are automatically routed through the backend proxy for security, CORS handling, and credential management.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Use secure proxy</Label>
                  <p className="text-xs text-muted-foreground">
                    Route this call through the backend proxy. Secrets stay server-side and allowed hosts are enforced.
                    {isExternalEndpoint && ' (Required for external APIs)'}
                  </p>
                </div>
                <Switch 
                  checked={useProxy} 
                  onCheckedChange={setUseProxy}
                  disabled={isExternalEndpoint}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credentialKey">Credential key (server-side)</Label>
                  <Input
                    id="credentialKey"
                    placeholder={copy.builder.apiConfig.bearerNamePlaceholder}
                    value={credentialKey}
                    onChange={(e) => setCredentialKey(e.target.value)}
                    disabled={!useProxy}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must match a credential configured on the server. Leave blank for public endpoints.
                  </p>
                </div>

                <div>
                  <Label htmlFor="baseUrlKey">Base URL key (optional)</Label>
                  <Input
                    id="baseUrlKey"
                    placeholder={copy.builder.apiConfig.basicNamePlaceholder}
                    value={baseUrlKey}
                    onChange={(e) => setBaseUrlKey(e.target.value)}
                    disabled={!useProxy}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    References a base URL configured on the server. If omitted, endpoint must be absolute.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                Avoid putting Authorization headers when using proxy—credentials should be injected server-side.
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!name || !endpoint}>
            {apiCall ? copy.builder.apiConfig.updateButton : copy.builder.apiConfig.addButton} API Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
