'use client';

import React, { useState, useEffect } from 'react';
import { getAuditLogs, getUserById } from '@/services/cmsApiService';
import { AuditLog } from '@/types/cms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ChevronLeft, 
  FileText, 
  Plus, 
  Edit, 
  Trash2,
  Globe,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogPanelProps {
  onClose: () => void;
  pageId?: string;
}

const actionIcons: Record<string, React.ElementType> = {
  'page.created': Plus,
  'page.updated': Edit,
  'page.published': Globe,
  'page.disabled': Eye,
  'page.deleted': Trash2,
  'page.seo_updated': Edit,
  'widget.added': Plus,
  'widget.removed': Trash2,
  'widget.updated': Edit,
  'template.created': Plus,
  'user.created': Plus,
  'settings.created': Settings,
  'settings.updated': Settings,
  'variable.added': Plus,
  'variable.removed': Trash2,
  'api_call.added': Plus,
  'api_call.removed': Trash2,
  'brand.updated': Edit,
};

const actionColors: Record<string, string> = {
  'page.created': 'bg-green-100 text-green-700',
  'page.updated': 'bg-blue-100 text-blue-700',
  'page.published': 'bg-primary/10 text-primary',
  'page.disabled': 'bg-yellow-100 text-yellow-700',
  'page.deleted': 'bg-red-100 text-red-700',
  'page.seo_updated': 'bg-blue-100 text-blue-700',
  'widget.added': 'bg-green-100 text-green-700',
  'widget.removed': 'bg-red-100 text-red-700',
  'widget.updated': 'bg-blue-100 text-blue-700',
  'template.created': 'bg-purple-100 text-purple-700',
  'user.created': 'bg-indigo-100 text-indigo-700',
  'settings.created': 'bg-gray-100 text-gray-700',
  'settings.updated': 'bg-gray-100 text-gray-700',
  'variable.added': 'bg-green-100 text-green-700',
  'variable.removed': 'bg-red-100 text-red-700',
  'api_call.added': 'bg-green-100 text-green-700',
  'api_call.removed': 'bg-red-100 text-red-700',
  'brand.updated': 'bg-blue-100 text-blue-700',
};

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ onClose, pageId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, { name?: string } | undefined>>({});

  const loadLogs = async () => {
    const filters = pageId ? { entityId: pageId } : undefined;
    const auditLogs = await getAuditLogs(filters);
    setLogs(auditLogs);
  };

  useEffect(() => {
    const load = async () => {
      const filters = pageId ? { entityId: pageId } : undefined;
      const auditLogs = await getAuditLogs(filters);
      setLogs(auditLogs);
    };
    load();
  }, [pageId]);

  useEffect(() => {
    const uniqueIds = [...new Set(logs.map((log) => log.userId))];
    let cancelled = false;
    Promise.all(uniqueIds.map((userId) => getUserById(userId))).then((users) => {
      if (cancelled) return;
      const next = uniqueIds.reduce<Record<string, { name?: string } | undefined>>((acc, id, i) => {
        acc[id] = users[i];
        return acc;
      }, {});
      setUserMap((prev) => ({ ...prev, ...next }));
    });
    return () => { cancelled = true; };
  }, [logs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const filters = pageId ? { entityId: pageId } : undefined;
    const auditLogs = await getAuditLogs(filters);
    setLogs(auditLogs);
    setIsRefreshing(false);
  };

  const formatAction = (action: string) => {
    return action.replace('.', ' ').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="h-14 px-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-foreground">Activity Log</h2>
          <p className="text-xs text-muted-foreground">
            {pageId ? 'Page history' : 'All activity'} ({logs.length} entries)
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          className={isRefreshing ? 'animate-spin' : ''}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />

              <div className="space-y-4">
                {logs.map((log) => {
                  const user = userMap[log.userId];
                  const ActionIcon = actionIcons[log.action] || Edit;
                  const colorClass = actionColors[log.action] || 'bg-muted text-muted-foreground';

                  return (
                    <div key={log.id} className="relative flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground capitalize">
                            {formatAction(log.action)}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {log.entityType}
                          </Badge>
                        </div>
                        
                        {/* Details */}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                            {log.details.pageName && (
                              <div>Page: <span className="font-medium">{log.details.pageName as string}</span></div>
                            )}
                            {log.details.widgetName && (
                              <div>Widget: <span className="font-medium">{log.details.widgetName as string}</span></div>
                            )}
                            {log.details.templateName && (
                              <div>Template: <span className="font-medium">{log.details.templateName as string}</span></div>
                            )}
                            {log.details.userName && (
                              <div>User: <span className="font-medium">{log.details.userName as string}</span></div>
                            )}
                            {log.details.variableName && (
                              <div>Variable: <span className="font-mono">{log.details.variableName as string}</span></div>
                            )}
                            {log.details.apiName && (
                              <div>API: <span className="font-medium">{log.details.apiName as string}</span></div>
                            )}
                            {log.details.uri && (
                              <div className="font-mono text-xs mt-1">
                                URI: {log.details.uri as string}
                              </div>
                            )}
                            {log.details.changes && Array.isArray(log.details.changes) && (
                              <div className="mt-1">
                                Changes: {(log.details.changes as string[]).join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        {/* User and time */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px]">
                              {user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user?.name || 'Unknown'}</span>
                          <span>·</span>
                          <span>
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};