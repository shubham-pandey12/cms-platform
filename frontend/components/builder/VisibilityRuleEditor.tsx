'use client';

import React, { useState } from 'react';
import { VisibilityRule } from '@/types/cms';
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
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisibilityRuleEditorProps {
  rules: VisibilityRule[];
  onAdd: (rule: VisibilityRule) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, rule: VisibilityRule) => void;
}

export const VisibilityRuleEditor: React.FC<VisibilityRuleEditorProps> = ({
  rules,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const [newRule, setNewRule] = useState<Partial<VisibilityRule>>({
    type: 'device',
    condition: 'equals',
    value: '',
  });

  const handleAddRule = () => {
    if (!newRule.type || !newRule.condition || !newRule.value) {
      return;
    }
    onAdd({
      type: newRule.type,
      condition: newRule.condition,
      value: newRule.value,
    });
    // Reset form
    setNewRule({
      type: 'device',
      condition: 'equals',
      value: '',
    });
  };

  const getConditionOptions = (type: VisibilityRule['type']) => {
    switch (type) {
      case 'device':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not-equals', label: 'Not Equals' },
        ];
      case 'auth':
        return [
          { value: 'is', label: 'Is' },
          { value: 'is-not', label: 'Is Not' },
        ];
      case 'date':
        return [
          { value: 'before', label: 'Before' },
          { value: 'after', label: 'After' },
          { value: 'between', label: 'Between' },
        ];
      case 'url-param':
        return [
          { value: 'exists', label: 'Exists' },
          { value: 'not-exists', label: 'Not Exists' },
          { value: 'equals', label: 'Equals' },
          { value: 'not-equals', label: 'Not Equals' },
        ];
      default:
        return [];
    }
  };

  const getValueInput = (type: VisibilityRule['type'], condition: string) => {
    switch (type) {
      case 'device':
        return (
          <Select
            value={newRule.value}
            onValueChange={(value) => setNewRule(prev => ({ ...prev, value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'auth':
        return (
          <Select
            value={newRule.value}
            onValueChange={(value) => setNewRule(prev => ({ ...prev, value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select auth state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="authenticated">Authenticated</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'date':
        if (condition === 'between') {
          return (
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="Start date"
                value={newRule.value?.split('|')[0] || ''}
                onChange={(e) => {
                  const end = newRule.value?.split('|')[1] || '';
                  setNewRule(prev => ({ ...prev, value: `${e.target.value}|${end}` }));
                }}
              />
              <Input
                type="date"
                placeholder="End date"
                value={newRule.value?.split('|')[1] || ''}
                onChange={(e) => {
                  const start = newRule.value?.split('|')[0] || '';
                  setNewRule(prev => ({ ...prev, value: `${start}|${e.target.value}` }));
                }}
              />
            </div>
          );
        }
        return (
          <Input
            type="date"
            value={newRule.value}
            onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
          />
        );
      case 'url-param':
        if (condition === 'exists' || condition === 'not-exists') {
          return (
            <Input
              placeholder="Parameter name"
              value={newRule.value}
              onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
            />
          );
        }
        return (
          <Input
            placeholder="paramName=value"
            value={newRule.value}
            onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
          />
        );
      default:
        return (
          <Input
            value={newRule.value}
            onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Visibility Rules</Label>
        <span className="text-xs text-muted-foreground">
          {rules.length} rule{rules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border bg-muted/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize">{rule.type}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{rule.condition}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {rule.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Rule */}
      <div className="p-3 rounded-lg border border-dashed border-border space-y-3">
        <Label className="text-sm">Add Visibility Rule</Label>
        
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Type</Label>
            <Select
              value={newRule.type}
              onValueChange={(value: VisibilityRule['type']) => {
                const defaultCondition = getConditionOptions(value)[0]?.value || '';
                setNewRule(prev => ({
                  ...prev,
                  type: value,
                  condition: defaultCondition,
                  value: '',
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="device">Device</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="url-param">URL Parameter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newRule.type && (
            <div>
              <Label className="text-xs">Condition</Label>
              <Select
                value={newRule.condition}
                onValueChange={(value) => {
                  setNewRule(prev => ({ ...prev, condition: value, value: '' }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getConditionOptions(newRule.type).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {newRule.type && newRule.condition && (
            <div>
              <Label className="text-xs">Value</Label>
              {getValueInput(newRule.type, newRule.condition)}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddRule}
            disabled={!newRule.type || !newRule.condition || !newRule.value}
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {rules.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No visibility rules. Widget will be visible to everyone.
        </p>
      )}
    </div>
  );
};
