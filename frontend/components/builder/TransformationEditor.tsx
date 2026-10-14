'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Eye, AlertCircle } from 'lucide-react';
import {
  TRANSFORMATION_DEFINITIONS,
  TransformationConfig,
  getTransformationDefinition,
  validateTransformation,
} from '@/lib/fieldTransformations';

interface TransformationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transformation?: TransformationConfig | null;
  sampleValue?: unknown;
  onSave: (transformation: TransformationConfig) => void;
}

export const TransformationEditor: React.FC<TransformationEditorProps> = ({
  open,
  onOpenChange,
  transformation,
  sampleValue,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<string>(transformation?.type || 'format_date');
  const [params, setParams] = useState<Record<string, unknown>>(transformation?.params || {});
  const [customFunction, setCustomFunction] = useState<string>(transformation?.customFunction || '');
  const [previewValue, setPreviewValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (transformation) {
      setSelectedType(transformation.type);
      setParams(transformation.params || {});
      setCustomFunction(transformation.customFunction || '');
    } else {
      setSelectedType('format_date');
      setParams({});
      setCustomFunction('');
    }
  }, [transformation, open]);

  const updatePreview = useCallback(() => {
    if (sampleValue === undefined) {
      setPreviewValue('No sample value available');
      return;
    }

    const definition = getTransformationDefinition(selectedType as any);
    if (!definition) {
      setPreviewValue('Unknown transformation');
      return;
    }

    try {
      const result = definition.preview(
        sampleValue,
        selectedType === 'custom' ? { expression: customFunction } : params
      );
      setPreviewValue(String(result));
      setValidationError('');
    } catch (error) {
      setPreviewValue('Error');
      setValidationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [selectedType, params, customFunction, sampleValue]);

  // Update preview when type, params, or sample value changes
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleParamChange = (paramName: string, value: unknown) => {
    setParams(prev => ({ ...prev, [paramName]: value }));
  };

  const handleSave = () => {
    const config: TransformationConfig = {
      type: selectedType as any,
      params: Object.keys(params).length > 0 ? params : undefined,
      customFunction: selectedType === 'custom' ? customFunction : undefined,
    };

    const validation = validateTransformation(config);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid configuration');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  const definition = getTransformationDefinition(selectedType as any);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {transformation ? 'Edit Transformation' : 'Add Transformation'}
          </DialogTitle>
          <DialogDescription>
            Transform data before binding it to the widget field
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transformation Type */}
          <div className="space-y-2">
            <Label>Transformation Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSFORMATION_DEFINITIONS.map((def) => (
                  <SelectItem key={def.id} value={def.id}>
                    <div className="flex items-center gap-2">
                      <span>{def.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {definition && (
              <p className="text-xs text-muted-foreground">{definition.description}</p>
            )}
          </div>

          {/* Parameters */}
          {definition && definition.params.length > 0 && selectedType !== 'custom' && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium">Parameters</Label>
              {definition.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label className="text-xs">{param.label}</Label>
                  {param.type === 'number' ? (
                    <Input
                      type="number"
                      value={
                        (typeof params[param.name] === 'number'
                          ? params[param.name]
                          : typeof param.defaultValue === 'number'
                            ? param.defaultValue
                            : '') as string | number
                      }
                      onChange={(e) => handleParamChange(param.name, parseInt(e.target.value) || 0)}
                      placeholder={param.placeholder}
                      className="h-9"
                    />
                  ) : param.type === 'boolean' ? (
                    <Select
                      value={String(params[param.name] || param.defaultValue || 'false')}
                      onValueChange={(value) => handleParamChange(param.name, value === 'true')}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={
                        (typeof params[param.name] === 'string'
                          ? params[param.name]
                          : typeof param.defaultValue === 'string'
                            ? param.defaultValue
                            : String(params[param.name] ?? param.defaultValue ?? '')
                      ) as string
                      }
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      placeholder={param.placeholder}
                      className="h-9"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Custom Function Editor */}
          {selectedType === 'custom' && (
            <div className="space-y-2">
              <Label>JavaScript Expression</Label>
              <Textarea
                value={customFunction}
                onChange={(e) => setCustomFunction(e.target.value)}
                placeholder="value * 1.1"
                className="font-mono text-sm"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="px-1 py-0.5 bg-muted rounded">value</code> to reference the input. 
                Example: <code className="px-1 py-0.5 bg-muted rounded">value * 1.1</code> adds 10% markup
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 border rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Preview</Label>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Input:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {sampleValue !== undefined ? String(sampleValue) : 'No sample data'}
                </Badge>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Output:</p>
                <Badge 
                  variant={validationError ? 'destructive' : 'default'} 
                  className="font-mono text-xs"
                >
                  {previewValue}
                </Badge>
              </div>
            </div>

            {validationError && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-destructive/10 border border-destructive/50 rounded text-xs">
                <AlertCircle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                <span className="text-destructive">{validationError}</span>
              </div>
            )}
          </div>

          {/* Examples */}
          {definition && (
            <div className="p-3 border rounded-lg bg-primary/5">
              <Label className="text-xs font-medium text-primary">Quick Examples</Label>
              <div className="mt-2 space-y-1">
                {selectedType === 'format_date' && (
                  <p className="text-xs text-muted-foreground">
                    • Converts &quot;2024-01-15&quot; to &quot;January 15, 2024&quot;
                  </p>
                )}
                {selectedType === 'format_currency' && (
                  <p className="text-xs text-muted-foreground">
                    • Converts 99.99 to &quot;$99.99&quot; (or other currency)
                  </p>
                )}
                {selectedType === 'concatenate' && (
                  <p className="text-xs text-muted-foreground">
                    • Joins [&quot;John&quot;, &quot;Doe&quot;] to &quot;John Doe&quot; with separator
                  </p>
                )}
                {selectedType === 'substring' && (
                  <p className="text-xs text-muted-foreground">
                    • Extracts portion: &quot;Hello World&quot; (0, 5) → &quot;Hello&quot;
                  </p>
                )}
                {selectedType === 'custom' && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      • Add 10% markup: <code className="bg-muted px-1 py-0.5 rounded">value * 1.1</code>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      • Round number: <code className="bg-muted px-1 py-0.5 rounded">Math.round(value)</code>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!validationError}>
            {transformation ? 'Update' : 'Add'} Transformation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
