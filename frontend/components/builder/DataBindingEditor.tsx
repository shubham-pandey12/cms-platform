'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DataBinding, ApiCall, PageVariable } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Trash2, Plus, Code, Copy, CheckCircle2, XCircle, Loader2, ChevronDown, Sparkles, Wand2 } from 'lucide-react';
import { getNestedValue } from '@/lib/templateEngine';
import { cn } from '@/lib/utils';
import { copy, formatCopy } from '@/lib/copy';
import { suggestMappings, FieldMatch } from '@/lib/autoMapper';
import { BulkMappingDialog } from './BulkMappingDialog';
import { TransformationEditor } from './TransformationEditor';
import { TransformationConfig } from '@/lib/fieldTransformations';
import { toast } from 'sonner';

interface DataBindingEditorProps {
  bindings: DataBinding[];
  apiCalls: ApiCall[];
  variables: PageVariable[];
  apiResponses?: Record<string, unknown>;
  isLoadingApiResponses?: boolean;
  onAdd: (binding: DataBinding) => void;
  onRemove: (bindingId: string) => void;
  onUpdate: (bindingId: string, updates: Partial<DataBinding>) => void;
  availableProps: string[]; // Available widget config properties
}

interface PathInfo {
  path: string;
  value: unknown;
  type: string;
  depth: number;
}

export const DataBindingEditor: React.FC<DataBindingEditorProps> = ({
  bindings,
  apiCalls,
  variables,
  apiResponses = {},
  isLoadingApiResponses = false,
  onAdd,
  onRemove,
  onUpdate,
  availableProps,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBinding, setEditingBinding] = useState<Partial<DataBinding> | null>(null);
  const [selectedSource, setSelectedSource] = useState<'variable' | 'api_response'>('variable');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [sourcePath, setSourcePath] = useState<string>('');
  const [targetProp, setTargetProp] = useState<string>('');
  const [pathPopoverOpen, setPathPopoverOpen] = useState(false);
  const [pathSearch, setPathSearch] = useState('');
  const [showBulkMappingDialog, setShowBulkMappingDialog] = useState(false);
  const [showTransformationEditor, setShowTransformationEditor] = useState(false);
  const [transformation, setTransformation] = useState<TransformationConfig | undefined>();
  const [mappingSuggestions, setMappingSuggestions] = useState<FieldMatch[]>([]);

  const handleAdd = () => {
    setEditingBinding(null);
    setSelectedSource('variable');
    setSelectedSourceId('');
    setSourcePath('');
    setTargetProp('');
    setPathSearch('');
    setTransformation(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (binding: DataBinding) => {
    setEditingBinding(binding);
    setSelectedSource(binding.sourceType);
    setSelectedSourceId(binding.sourceId);
    setSourcePath(binding.sourcePath);
    setTargetProp(binding.targetProp);
    setPathSearch(binding.sourcePath);
    setTransformation(binding.transform);
    setIsDialogOpen(true);
  };

  const handleAutoMap = () => {
    // Get the first API response available
    const firstApiCallId = Object.keys(apiResponses)[0];
    if (!firstApiCallId) {
      toast.error(copy.builder.dataBinding.toast.noApiResponses);
      return;
    }

    const apiResponse = apiResponses[firstApiCallId];
    const suggestions = suggestMappings(apiResponse, availableProps, 60);
    
    if (suggestions.length === 0) {
      toast.info(copy.builder.dataBinding.toast.noMappingSuggestions);
      return;
    }

    setMappingSuggestions(suggestions);
    setShowBulkMappingDialog(true);
  };

  const handleApplyBulkMappings = (selectedMappings: FieldMatch[]) => {
    selectedMappings.forEach(mapping => {
      const binding: DataBinding = {
        id: uuidv4(),
        targetProp: mapping.widgetField,
        sourceType: 'api_response',
        sourceId: Object.keys(apiResponses)[0], // Use first API call
        sourcePath: mapping.apiPath,
      };
      onAdd(binding);
    });
    toast.success(formatCopy(copy.builder.dataBinding.toast.appliedMappings, { count: selectedMappings.length }));
  };

  const handleAddTransformation = () => {
    setShowTransformationEditor(true);
  };

  const handleSaveTransformation = (config: TransformationConfig) => {
    setTransformation(config);
  };

  // Reset path when source changes
  useEffect(() => {
    if (selectedSource === 'variable') {
      setSourcePath('');
      setPathSearch('');
    } else if (selectedSource === 'api_response' && !selectedSourceId) {
      setSourcePath('');
      setPathSearch('');
    }
  }, [selectedSource, selectedSourceId]);

  // Helper function to format preview values (stable ref for useMemo deps)
  const formatPreviewValue = React.useCallback((value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'Array (empty)';
      }
      const firstItem = formatPreviewValue(value[0]);
      return `Array (${value.length} items) - First: ${firstItem}`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return 'Object (empty)';
      }
      return `Object (${keys.length} keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`;
    }

    return String(value);
  }, []);

  // Validate path and get preview value
  const previewData = useMemo(() => {
    if (!selectedSourceId) {
      return { value: null, isValid: false, error: null, formatted: '' };
    }

    if (selectedSource === 'variable') {
      const variable = variables.find(v => v.name === selectedSourceId);
      const value = variable?.value || null;
      return {
        value,
        isValid: value !== null && value !== undefined,
        error: value === null || value === undefined ? 'Variable not found' : null,
        formatted: formatPreviewValue(value),
      };
    }

    if (selectedSource === 'api_response') {
      const apiResponse = selectedSourceId ? apiResponses[selectedSourceId] : undefined;
      
      if (!apiResponse || !selectedSourceId) {
        return {
          value: null,
          isValid: false,
          error: isLoadingApiResponses ? 'Loading...' : 'API response not available',
          formatted: isLoadingApiResponses ? 'Loading...' : 'No data available',
        };
      }

      if (!sourcePath) {
        return {
          value: apiResponse,
          isValid: true,
          error: null,
          formatted: formatPreviewValue(apiResponse),
        };
      }

      try {
        const value = getNestedValue(apiResponse, sourcePath);
        const isValid = value !== undefined && value !== null;
        return {
          value,
          isValid,
          error: isValid ? null : 'Path not found in response',
          formatted: formatPreviewValue(value),
        };
      } catch (error) {
        return {
          value: null,
          isValid: false,
          error: 'Invalid path format',
          formatted: 'Error: Invalid path',
        };
      }
    }

    return { value: null, isValid: false, error: null, formatted: '' };
  }, [selectedSourceId, selectedSource, sourcePath, apiResponses, variables, isLoadingApiResponses, formatPreviewValue]);

  const handleSave = () => {
    if (!targetProp || !selectedSourceId) return;
    
    // Validate path for API responses
    if (selectedSource === 'api_response' && !previewData.isValid && sourcePath) {
      return; // Don't save if path is invalid
    }

    const binding: DataBinding = {
      id: editingBinding?.id || uuidv4(),
      targetProp,
      sourceType: selectedSource,
      sourceId: selectedSourceId,
      sourcePath: selectedSource === 'api_response' ? sourcePath : selectedSourceId,
      transform: transformation,
      defaultValue: editingBinding?.defaultValue,
    };

    if (editingBinding?.id) {
      onUpdate(editingBinding.id, binding);
    } else {
      onAdd(binding);
    }

    setIsDialogOpen(false);
  };

  // Improved path extraction with depth limiting and better structure
  const getAvailablePaths = React.useCallback((): PathInfo[] => {
    if (selectedSource !== 'api_response' || !selectedSourceId) return [];
    
    const apiResponse = apiResponses[selectedSourceId];
    if (!apiResponse || typeof apiResponse !== 'object') return [];

    const paths: PathInfo[] = [];
    const MAX_DEPTH = 5; // Limit depth to prevent overwhelming UI

    const extractPaths = (obj: unknown, prefix = '', depth = 0): void => {
      if (depth > MAX_DEPTH) return;

      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          // Add array index path
          if (obj.length > 0) {
            paths.push({
              path: prefix ? `${prefix}[0]` : '[0]',
              value: obj[0],
              type: Array.isArray(obj[0]) ? 'array' : typeof obj[0],
              depth: depth + 1,
            });
            // Recursively extract paths from first item
            extractPaths(obj[0], prefix ? `${prefix}[0]` : '[0]', depth + 1);
          } else {
            paths.push({
              path: prefix ? `${prefix}[]` : '[]',
              value: null,
              type: 'array',
              depth: depth + 1,
            });
          }
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            const valueType = Array.isArray(value) ? 'array' : typeof value;
            
            paths.push({
              path,
              value,
              type: valueType,
              depth: depth + 1,
            });

            // Recursively extract nested paths
            if (typeof value === 'object' && value !== null && depth < MAX_DEPTH) {
              extractPaths(value, path, depth + 1);
            }
          });
        }
      }
    };

    extractPaths(apiResponse);
    
    // Sort by depth, then by path
    return paths.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.path.localeCompare(b.path);
    });
  }, [selectedSource, selectedSourceId, apiResponses]);

  const availablePaths = useMemo(() => getAvailablePaths(), [getAvailablePaths]);

  // Filter paths based on search
  const filteredPaths = useMemo(() => {
    if (!pathSearch) return availablePaths;
    const searchLower = pathSearch.toLowerCase();
    return availablePaths.filter(p => 
      p.path.toLowerCase().includes(searchLower) ||
      (typeof p.value === 'string' && p.value.toLowerCase().includes(searchLower))
    );
  }, [availablePaths, pathSearch]);

  const handlePathSelect = (path: string) => {
    setSourcePath(path);
    setPathSearch(path);
    setPathPopoverOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Data Bindings</span>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(apiResponses).length > 0 && (
            <Button variant="outline" size="sm" onClick={handleAutoMap}>
              <Wand2 className="w-4 h-4 mr-1" />
              Auto-Map
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Binding
          </Button>
        </div>
      </div>

      {bindings.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No data bindings configured. Add bindings to connect API data or variables to widget properties.
        </p>
      ) : (
        <div className="space-y-2">
          {bindings.map((binding) => {
            const sourceLabel = binding.sourceType === 'variable'
              ? variables.find(v => v.name === binding.sourceId)?.name || binding.sourceId
              : apiCalls.find(a => a.id === binding.sourceId)?.name || binding.sourceId;

            return (
              <div
                key={binding.id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {binding.targetProp}
                    </Badge>
                    <span className="text-xs text-muted-foreground">←</span>
                    <span className="text-xs truncate">{sourceLabel}</span>
                    {binding.sourceType === 'api_response' && (
                      <span className="text-xs text-muted-foreground truncate">
                        .{binding.sourcePath}
                      </span>
                    )}
                    {binding.transform && (
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Transform
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleEdit(binding)}
                  >
                    <Code className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => onRemove(binding.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBinding ? 'Edit Data Binding' : 'Add Data Binding'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Target Property */}
            <div>
              <Label>Target Property</Label>
              <Select value={targetProp} onValueChange={setTargetProp}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {availableProps.map((prop) => (
                    <SelectItem key={prop} value={prop}>
                      {prop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Type */}
            <div>
              <Label>Source Type</Label>
              <Select
                value={selectedSource}
                onValueChange={(value: 'variable' | 'api_response') => {
                  setSelectedSource(value);
                  setSelectedSourceId('');
                  setSourcePath('');
                  setPathSearch('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variable">Variable</SelectItem>
                  <SelectItem value="api_response">API Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source Selection */}
            <div>
              <Label>
                {selectedSource === 'variable' ? 'Variable' : 'API Call'}
              </Label>
              <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSource === 'variable' ? (
                    variables.map((variable) => (
                      <SelectItem key={variable.name} value={variable.name}>
                        {variable.name}
                      </SelectItem>
                    ))
                  ) : (
                    apiCalls.map((apiCall) => (
                      <SelectItem key={apiCall.id} value={apiCall.id}>
                        {apiCall.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Source Path (for API responses) */}
            {selectedSource === 'api_response' && selectedSourceId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Data Path (dot notation)</Label>
                  {availablePaths.length > 0 && (
                    <Popover open={pathPopoverOpen} onOpenChange={setPathPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Browse Paths
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search paths..." 
                            value={pathSearch}
                            onValueChange={setPathSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No paths found.</CommandEmpty>
                            <CommandGroup heading="Available Paths">
                              {filteredPaths.map((pathInfo) => (
                                <CommandItem
                                  key={pathInfo.path}
                                  value={pathInfo.path}
                                  onSelect={() => handlePathSelect(pathInfo.path)}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-mono text-sm">{pathInfo.path}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {pathInfo.type} {pathInfo.depth > 1 && `(depth ${pathInfo.depth})`}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <Input
                  value={sourcePath}
                  onChange={(e) => {
                    setSourcePath(e.target.value);
                    setPathSearch(e.target.value);
                  }}
                  placeholder="e.g., data.attributes.title"
                  className={cn(
                    previewData.isValid === false && sourcePath ? 'border-destructive' : ''
                  )}
                />
                {sourcePath && previewData.isValid === false && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {previewData.error || 'Invalid path'}
                  </p>
                )}
              </div>
            )}

            {/* Preview */}
            {selectedSourceId && (
              <div className={cn(
                "p-3 rounded-lg border",
                previewData.isValid 
                  ? "bg-muted border-border" 
                  : "bg-destructive/10 border-destructive/50"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    Preview Value
                    {previewData.isValid ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                  </Label>
                  {previewData.formatted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(
                        typeof previewData.value === 'object' 
                          ? JSON.stringify(previewData.value, null, 2)
                          : String(previewData.value)
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
                {isLoadingApiResponses && selectedSource === 'api_response' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading API response...
                  </div>
                ) : previewData.formatted ? (
                  <div className="space-y-1">
                    <p className="text-sm font-mono break-words">
                      {previewData.formatted}
                    </p>
                    {typeof previewData.value === 'object' && previewData.value !== null && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          View full JSON
                        </summary>
                        <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(previewData.value, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {previewData.error || 'No value'}
                  </p>
                )}
              </div>
            )}

            {/* Transformation Section */}
            {selectedSourceId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Transformation (Optional)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTransformation}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {transformation ? 'Edit' : 'Add'} Transform
                  </Button>
                </div>
                {transformation && (
                  <div className="p-2 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {transformation.type.replace(/_/g, ' ')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setTransformation(undefined)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={
                !targetProp || 
                !selectedSourceId || 
                (selectedSource === 'api_response' && sourcePath && !previewData.isValid)
              }
            >
              {editingBinding ? 'Update' : 'Add'} Binding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Mapping Dialog */}
      <BulkMappingDialog
        open={showBulkMappingDialog}
        onOpenChange={setShowBulkMappingDialog}
        suggestions={mappingSuggestions}
        onApply={handleApplyBulkMappings}
      />

      {/* Transformation Editor */}
      <TransformationEditor
        open={showTransformationEditor}
        onOpenChange={setShowTransformationEditor}
        transformation={transformation}
        sampleValue={previewData.value}
        onSave={handleSaveTransformation}
      />
    </div>
  );
};
