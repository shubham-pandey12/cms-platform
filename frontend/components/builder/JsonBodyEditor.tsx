'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Code2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonBodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowVariables?: boolean;
  variables?: string[];
  minHeight?: string;
}

export const JsonBodyEditor: React.FC<JsonBodyEditorProps> = ({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  allowVariables = true,
  variables = [],
  minHeight = '200px',
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [formatted, setFormatted] = useState<boolean>(false);

  const validateJson = useCallback((jsonString: string) => {
    if (!jsonString.trim()) {
      setIsValid(null);
      setError('');
      return;
    }

    try {
      // Remove variable placeholders temporarily for validation
      const cleanedJson = allowVariables
        ? jsonString.replace(/{{[^}]+}}/g, '"__VARIABLE__"')
        : jsonString;

      JSON.parse(cleanedJson);
      setIsValid(true);
      setError('');
    } catch (err) {
      setIsValid(false);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, [allowVariables]);

  useEffect(() => {
    validateJson(value);
  }, [value, validateJson]);

  const handleFormat = () => {
    if (!value.trim()) return;

    try {
      // Preserve variable placeholders
      const variablePlaceholders: Record<string, string> = {};
      let placeholderIndex = 0;

      // Replace variables with placeholders
      const withPlaceholders = allowVariables
        ? value.replace(/{{([^}]+)}}/g, (match) => {
            const placeholder = `__VAR_${placeholderIndex}__`;
            variablePlaceholders[placeholder] = match;
            placeholderIndex++;
            return `"${placeholder}"`;
          })
        : value;

      // Parse and format
      const parsed = JSON.parse(withPlaceholders);
      let formatted = JSON.stringify(parsed, null, 2);

      // Restore variable placeholders
      if (allowVariables) {
        Object.entries(variablePlaceholders).forEach(([placeholder, original]) => {
          formatted = formatted.replace(`"${placeholder}"`, original);
        });
      }

      onChange(formatted);
      setFormatted(true);
      setTimeout(() => setFormatted(false), 2000);
    } catch (err) {
      // If formatting fails, keep original value
      console.error('Failed to format JSON:', err);
    }
  };

  const handleMinify = () => {
    if (!value.trim()) return;

    try {
      // Similar process as format but without spacing
      const variablePlaceholders: Record<string, string> = {};
      let placeholderIndex = 0;

      const withPlaceholders = allowVariables
        ? value.replace(/{{([^}]+)}}/g, (match) => {
            const placeholder = `__VAR_${placeholderIndex}__`;
            variablePlaceholders[placeholder] = match;
            placeholderIndex++;
            return `"${placeholder}"`;
          })
        : value;

      const parsed = JSON.parse(withPlaceholders);
      let minified = JSON.stringify(parsed);

      if (allowVariables) {
        Object.entries(variablePlaceholders).forEach(([placeholder, original]) => {
          minified = minified.replace(`"${placeholder}"`, original);
        });
      }

      onChange(minified);
    } catch (err) {
      console.error('Failed to minify JSON:', err);
    }
  };

  const insertVariable = (variable: string) => {
    const cursorPosition = 0; // Simplified - in real implementation would get cursor position
    const newValue = value + `{{${variable}}}`;
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Request Body (JSON)</Label>
          {isValid === true && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          )}
          {isValid === false && (
            <Badge variant="outline" className="text-destructive border-destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Invalid
            </Badge>
          )}
          {formatted && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Formatted
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={isValid === false}
          >
            <Code2 className="w-4 h-4 mr-1" />
            Format
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMinify}
            disabled={isValid === false}
          >
            <Minimize2 className="w-4 h-4 mr-1" />
            Minify
          </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'font-mono text-sm',
            isValid === false && 'border-destructive focus-visible:ring-destructive'
          )}
          style={{ minHeight }}
        />
      </div>

      {isValid === false && error && (
        <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/50 rounded text-sm">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">JSON Syntax Error</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {allowVariables && variables.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Available Variables:</Label>
          <div className="flex flex-wrap gap-1">
            {variables.map((variable) => (
              <Button
                key={variable}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-mono"
                onClick={() => insertVariable(variable)}
              >
                {`{{${variable}}}`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {allowVariables && (
        <p className="text-xs text-muted-foreground">
          Tip: Use {`{{VARIABLE_NAME}}`} syntax to insert dynamic values from page variables.
        </p>
      )}
    </div>
  );
};
