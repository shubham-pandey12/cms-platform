'use client';

import React, { useState } from 'react';
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
import { Plus, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showPresets?: boolean;
  presets?: { label: string; key: string; value: string }[];
  allowVariables?: boolean;
  variables?: string[];
}

const DEFAULT_HEADER_PRESETS = [
  { label: 'Content-Type: JSON', key: 'Content-Type', value: 'application/json' },
  { label: 'Content-Type: Form', key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
  { label: 'Accept: JSON', key: 'Accept', value: 'application/json' },
  { label: 'Authorization: Bearer', key: 'Authorization', value: 'Bearer {{TOKEN}}' },
  { label: 'X-API-Key', key: 'X-API-Key', value: '{{API_KEY}}' },
];

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  showPresets = false,
  presets = DEFAULT_HEADER_PRESETS,
  allowVariables = true,
  variables = [],
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handleAdd = () => {
    onChange([...pairs, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const handleKeyChange = (index: number, key: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], key };
    onChange(newPairs);
  };

  const handleValueChange = (index: number, value: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], value };
    onChange(newPairs);
  };

  const handlePresetSelect = (presetValue: string) => {
    const preset = presets.find((p) => p.label === presetValue);
    if (preset) {
      onChange([...pairs, { key: preset.key, value: preset.value }]);
    }
    setSelectedPreset('');
  };

  const handleDuplicate = (index: number) => {
    const pair = pairs[index];
    onChange([...pairs, { ...pair }]);
  };

  const insertVariable = (index: number, variable: string) => {
    const currentValue = pairs[index].value;
    const newValue = currentValue + `{{${variable}}}`;
    handleValueChange(index, newValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Key-Value Pairs</Label>
        <div className="flex items-center gap-2">
          {showPresets && presets.length > 0 && (
            <Select value={selectedPreset} onValueChange={handlePresetSelect}>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder="Add preset..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.label} value={preset.label}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {pairs.length === 0 ? (
        <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
          No pairs added yet. Click &quot;Add&quot; to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map((pair, index) => (
            <div key={index} className="flex items-start gap-2 p-2 border rounded-lg bg-muted/30">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      value={pair.key}
                      onChange={(e) => handleKeyChange(index, e.target.value)}
                      placeholder={keyPlaceholder}
                      className="h-8"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      value={pair.value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder={valuePlaceholder}
                      className="h-8"
                    />
                  </div>
                </div>
                {allowVariables && variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Quick insert:</span>
                    {variables.slice(0, 3).map((variable) => (
                      <Button
                        key={variable}
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-xs"
                        onClick={() => insertVariable(index, variable)}
                      >
                        {`{{${variable}}}`}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleDuplicate(index)}
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => handleRemove(index)}
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
