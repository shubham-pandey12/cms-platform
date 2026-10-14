'use client';

import React, { useState } from 'react';
import { Action, ApiCall } from '@/types/cms';
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
import { Trash2, Plus, Zap } from 'lucide-react';

interface ActionEditorProps {
  actions: Record<string, Action>;
  apiCalls: ApiCall[];
  onAdd: (actionName: string, action: Action) => void;
  onRemove: (actionName: string) => void;
  onUpdate: (actionName: string, updates: Partial<Action>) => void;
  availableActionNames?: string[]; // e.g., ['onClick', 'onHover']
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
  actions,
  apiCalls,
  onAdd,
  onRemove,
  onUpdate,
  availableActionNames = ['onClick'],
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActionName, setEditingActionName] = useState<string | null>(null);
  const [actionName, setActionName] = useState<string>('onClick');
  const [actionType, setActionType] = useState<Action['type']>('navigate');
  const [payload, setPayload] = useState<Action['payload']>({});

  const handleAdd = () => {
    setEditingActionName(null);
    setActionName('onClick');
    setActionType('navigate');
    setPayload({});
    setIsDialogOpen(true);
  };

  const handleEdit = (name: string, action: Action) => {
    setEditingActionName(name);
    setActionName(name);
    setActionType(action.type);
    setPayload({ ...action.payload });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!actionName || !actionType) return;

    const newAction: Action = {
      type: actionType,
      payload: { ...payload },
    };

    if (editingActionName) {
      onUpdate(editingActionName, newAction);
    } else {
      onAdd(actionName, newAction);
    }

    setIsDialogOpen(false);
  };

  const updatePayload = (key: keyof Action['payload'], value: string) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Actions</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add Action
        </Button>
      </div>

      {Object.keys(actions).length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No actions configured. Add actions to define what happens when users interact with this widget.
        </p>
      ) : (
        <div className="space-y-2">
          {Object.entries(actions).map(([name, action]) => (
            <div
              key={name}
              className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Badge variant="outline" className="text-xs">
                    {action.type}
                  </Badge>
                  {action.payload.url && (
                    <span className="text-xs text-muted-foreground truncate">
                      {action.payload.url}
                    </span>
                  )}
                  {action.payload.targetId && (
                    <span className="text-xs text-muted-foreground truncate">
                      #{action.payload.targetId}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleEdit(name, action)}
                >
                  <Zap className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={() => onRemove(name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActionName ? 'Edit Action' : 'Add Action'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Name */}
            {!editingActionName && (
              <div>
                <Label>Action Name</Label>
                <Select value={actionName} onValueChange={setActionName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableActionNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Type */}
            <div>
              <Label>Action Type</Label>
              <Select
                value={actionType}
                onValueChange={(value: Action['type']) => {
                  setActionType(value);
                  setPayload({}); // Reset payload when type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="navigate">Navigate</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="trigger_api">Trigger API</SelectItem>
                  <SelectItem value="open_modal">Open Modal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payload Fields based on Action Type */}
            {actionType === 'navigate' && (
              <div>
                <Label>URL</Label>
                <Input
                  value={payload.url || ''}
                  onChange={(e) => updatePayload('url', e.target.value)}
                  placeholder="https://example.com or /page"
                />
              </div>
            )}

            {actionType === 'scroll' && (
              <div>
                <Label>Target Element ID</Label>
                <Input
                  value={payload.targetId || ''}
                  onChange={(e) => updatePayload('targetId', e.target.value)}
                  placeholder="section-id"
                />
              </div>
            )}

            {actionType === 'trigger_api' && (
              <>
                <div>
                  <Label>API Call</Label>
                  <Select
                    value={payload.apiCallId || ''}
                    onValueChange={(value) => updatePayload('apiCallId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select API call" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiCalls.map((apiCall) => (
                        <SelectItem key={apiCall.id} value={apiCall.id}>
                          {apiCall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Method</Label>
                  <Select
                    value={payload.method || 'GET'}
                    onValueChange={(value: 'GET' | 'POST') => updatePayload('method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {actionType === 'open_modal' && (
              <div>
                <Label>Modal ID</Label>
                <Input
                  value={payload.targetId || ''}
                  onChange={(e) => updatePayload('targetId', e.target.value)}
                  placeholder="modal-id"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!actionName || !actionType}>
              {editingActionName ? 'Update' : 'Add'} Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
