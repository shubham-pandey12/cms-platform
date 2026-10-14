'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePageBuilder } from '@/contexts/PageBuilderContext';
import { getPageData } from '@/services/cmsApiService';
import { PageVariable, ApiCall, PageDataConfig } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
} from '@/components/ui/dialog';
import { 
  Variable, 
  Database, 
  Plus, 
  ChevronRight, 
  Trash2,
  Globe,
  Code,
  Play,
  CheckCircle2,
  Edit2,
  Key,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';
import { ApiConfigDialog } from './ApiConfigDialog';

interface PageDataPanelProps {
  onClose: () => void;
}

export const PageDataPanel: React.FC<PageDataPanelProps> = ({ onClose }) => {
  const { currentPage } = usePageBuilder();
  const [openSections, setOpenSections] = useState<string[]>(['variables', 'apis']);
  const [pageData, setPageData] = useState<PageDataConfig | null>(null);
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  
  // Dialog states
  const [showAddVariable, setShowAddVariable] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiCall | null>(null);
  const [newVariable, setNewVariable] = useState<PageVariable>({ name: '', value: '', source: 'static' });

  useEffect(() => {
    if (currentPage) {
      getPageData(currentPage.id).then((data) => {
        setPageData({
          id: '',
          pageId: currentPage.id,
          variables: data?.variables ?? [],
          apiCalls: data?.apiCalls ?? [],
        });
      });
      // Load stored route params for preview
      try {
        const raw = localStorage.getItem(`mcms_route_params_${currentPage.id}`);
        const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
        setRouteParams(parsed);
      } catch {
        setRouteParams({});
      }
    }
  }, [currentPage]);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const addPageVariableLocal = (pageId: string, variable: PageVariable): PageDataConfig | null => {
    if (!pageData || pageData.pageId !== pageId) return null;
    return { ...pageData, variables: [...pageData.variables, variable] };
  };

  const removePageVariableLocal = (pageId: string, variableName: string): PageDataConfig | null => {
    if (!pageData || pageData.pageId !== pageId) return null;
    return { ...pageData, variables: pageData.variables.filter((v) => v.name !== variableName) };
  };

  const addApiCallLocal = (pageId: string, apiCall: ApiCall): PageDataConfig | null => {
    if (!pageData || pageData.pageId !== pageId) return null;
    return { ...pageData, apiCalls: [...pageData.apiCalls, apiCall] };
  };

  const updateApiCallLocal = (pageId: string, id: string, apiCall: ApiCall): PageDataConfig | null => {
    if (!pageData || pageData.pageId !== pageId) return null;
    return {
      ...pageData,
      apiCalls: pageData.apiCalls.map((ac) => (ac.id === id ? apiCall : ac)),
    };
  };

  const removeApiCallLocal = (pageId: string, apiId: string): PageDataConfig | null => {
    if (!pageData || pageData.pageId !== pageId) return null;
    return { ...pageData, apiCalls: pageData.apiCalls.filter((ac) => ac.id !== apiId) };
  };

  const handleAddVariable = () => {
    if (!currentPage || !newVariable.name) return;
    const result = addPageVariableLocal(currentPage.id, newVariable);
    if (result) {
      setPageData(result);
      setNewVariable({ name: '', value: '', source: 'static' });
      setShowAddVariable(false);
      toast.success(formatCopy(copy.builder.pageData.variableAdded, { name: newVariable.name }));
    }
  };

  const handleRemoveVariable = (variableName: string) => {
    if (!currentPage) return;
    const result = removePageVariableLocal(currentPage.id, variableName);
    if (result) {
      setPageData(result);
      toast.success(formatCopy(copy.builder.pageData.variableRemoved, { name: variableName }));
    }
  };

  const handleSaveApiCall = (apiCallData: Omit<ApiCall, 'id'> | ApiCall) => {
    if (!currentPage) return;

    if ('id' in apiCallData) {
      const result = updateApiCallLocal(currentPage.id, apiCallData.id, apiCallData);
      if (result) {
        setPageData(result);
        toast.success(formatCopy(copy.builder.pageData.apiUpdated, { name: apiCallData.name }));
      }
    } else {
      const newApiCall: ApiCall = {
        ...apiCallData,
        id: uuidv4(),
      };
      const result = addApiCallLocal(currentPage.id, newApiCall);
      if (result) {
        setPageData(result);
        toast.success(formatCopy(copy.builder.pageData.apiAdded, { name: newApiCall.name }));
      }
    }
  };

  const handleEditApi = (api: ApiCall) => {
    setEditingApi(api);
    setShowApiDialog(true);
  };

  const handleAddNewApi = () => {
    setEditingApi(null);
    setShowApiDialog(true);
  };

  const handleRemoveApiCall = (apiId: string) => {
    if (!currentPage) return;
    const result = removeApiCallLocal(currentPage.id, apiId);
    if (result) {
      setPageData(result);
      toast.success(copy.builder.pageData.apiRemoved);
    }
  };

  const handleTestApi = (api: ApiCall) => {
    toast.info(formatCopy(copy.builder.pageData.testingApi, { name: api.name }), {
      description: formatCopy(copy.builder.pageData.apiTestDescription, { method: api.method, endpoint: api.endpoint }),
    });
    // Simulate API test
    setTimeout(() => {
      toast.success(formatCopy(copy.builder.pageData.apiTestSuccess, { name: api.name }));
    }, 1000);
  };

  if (!currentPage) return null;

  const urlVariables = currentPage.dynamicVariables || [];
  const variables = pageData?.variables || [];
  const apiCalls = pageData?.apiCalls || [];

  const persistRouteParams = (next: Record<string, string>) => {
    if (!currentPage) return;
    localStorage.setItem(`mcms_route_params_${currentPage.id}`, JSON.stringify(next));
  };

  const updateRouteParam = (name: string, value: string) => {
    setRouteParams((prev) => {
      const next = { ...prev, [name]: value };
      persistRouteParams(next);

      if (pageData && currentPage) {
        const nonUrlVars = (pageData.variables || []).filter(
          v => v.source !== 'url' || !currentPage.dynamicVariables.includes(v.name)
        );
        const urlVars = currentPage.dynamicVariables.map((varName) => ({
          name: varName,
          value: next[varName] ?? '',
          source: 'url' as const,
        }));
        setPageData({ ...pageData, variables: [...nonUrlVars, ...urlVars] });
      }

      return next;
    });
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-medium text-foreground">Page Data</h2>
          <p className="text-xs text-muted-foreground">Page: {currentPage.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* URL Variables Section */}
          {urlVariables.length > 0 && (
            <Collapsible
              open={openSections.includes('url-vars')}
              onOpenChange={() => toggleSection('url-vars')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">URL Variables</span>
                  <Badge variant="secondary" className="ml-1">
                    {urlVariables.length}
                  </Badge>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  openSections.includes('url-vars') && "rotate-90"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                {urlVariables.map((variable) => (
                  <div 
                    key={variable}
                    className="space-y-2 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <Variable className="w-4 h-4 text-primary" />
                      <code className="text-sm font-mono">{'<' + variable + '>'}</code>
                      <Badge variant="outline" className="text-xs">URL</Badge>
                    </div>
                    <Input
                      value={routeParams[variable] ?? ''}
                      onChange={(e) => updateRouteParam(variable, e.target.value)}
                      placeholder={formatCopy(copy.builder.pageData.sampleValuePlaceholder, { variable })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in preview and data bindings as a URL variable.
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {urlVariables.length > 0 && <Separator />}

          {/* Page Variables Section */}
          <Collapsible
            open={openSections.includes('variables')}
            onOpenChange={() => toggleSection('variables')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2">
                <Variable className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Variables</span>
                <Badge variant="secondary" className="ml-1">
                  {variables.length}
                </Badge>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                openSections.includes('variables') && "rotate-90"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {variables.map((variable) => (
                <div 
                  key={variable.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{variable.name}</code>
                      <Badge variant="outline" className="text-xs capitalize">
                        {variable.source}
                      </Badge>
                    </div>
                    {variable.value && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        = {variable.value}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemoveVariable(variable.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setShowAddVariable(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* API Calls Section */}
          <Collapsible
            open={openSections.includes('apis')}
            onOpenChange={() => toggleSection('apis')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">API Calls</span>
                <Badge variant="secondary" className="ml-1">
                  {apiCalls.length}
                </Badge>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                openSections.includes('apis') && "rotate-90"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {apiCalls.map((api) => (
                <div 
                  key={api.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={api.method === 'GET' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {api.method}
                      </Badge>
                      <span className="text-sm font-medium">{api.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleEditApi(api)}
                        title={copy.builder.pageData.editTitle}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleTestApi(api)}
                        title={copy.builder.pageData.testTitle}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleRemoveApiCall(api.id)}
                        title={copy.builder.pageData.deleteTitle}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground truncate flex-1">
                      {api.endpoint}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-muted-foreground">Configured</span>
                    </div>
                    {api.auth && api.auth.type !== 'none' && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        {api.auth.type}
                      </Badge>
                    )}
                    {api.headers && Object.keys(api.headers).length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Key className="w-3 h-3 mr-1" />
                        {Object.keys(api.headers).length} headers
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={handleAddNewApi}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add API Call
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Data Binding Info */}
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Data Binding</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use {`{{VARIABLE_NAME}}`} syntax in widget fields to bind data dynamically.
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Add Variable Dialog */}
      <Dialog open={showAddVariable} onOpenChange={setShowAddVariable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.builder.pageData.addVariableTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Variable Name</Label>
              <Input
                value={newVariable.name}
                onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                placeholder={copy.builder.pageData.variableNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={newVariable.source}
                onValueChange={(value: 'static' | 'url' | 'api') => 
                  setNewVariable(prev => ({ ...prev, source: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static Value</SelectItem>
                  <SelectItem value="url">URL Parameter</SelectItem>
                  <SelectItem value="api">API Response</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newVariable.source === 'static' && (
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={newVariable.value}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={copy.builder.pageData.valuePlaceholder}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVariable(false)}>Cancel</Button>
            <Button onClick={handleAddVariable} disabled={!newVariable.name}>Add Variable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Configuration Dialog */}
      <ApiConfigDialog
        open={showApiDialog}
        onOpenChange={setShowApiDialog}
        apiCall={editingApi}
        onSave={handleSaveApiCall}
        variables={variables}
      />
    </div>
  );
};