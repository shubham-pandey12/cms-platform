'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ListUser } from '@/types/cms';
import type { Brand, RbacRoleDefinition } from '@/types/cms';
import { getUser, getUserAssignments, updateUser, updateUserAssignments } from '@/services/cmsApiService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';
import { normalizeRole } from '@/lib/roleCapabilities';
import { toUserAssignmentsUpdatePayload } from '@/lib/userAssignmentsPayload';

const ROLES = [
  { value: 'Admin', label: copy.users.roleAdmin },
  { value: 'ContentTeam', label: copy.users.roleContentTeam },
  { value: 'Engineer', label: copy.users.roleEngineer },
] as const;

type DialogTab = 'profile' | 'access';

type AssignmentRow = {
  clientKey: string;
  roleDefinitionId: string;
  scopeType: 'organization' | 'brand';
  scopeId: string | null;
};

function newClientKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ListUser | null;
  brands: Brand[];
  roles: RbacRoleDefinition[];
  onUserUpdated?: (user: ListUser) => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  brands,
  roles,
  onUserUpdated,
}: EditUserDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>('profile');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('ContentTeam');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);

  const roleLabelMap = useMemo(() => new Map<string, string>(ROLES.map((item) => [normalizeRole(item.value), item.label])), []);
  const permissionKeys = useMemo(
    () => Array.from(new Set(roles.flatMap((candidate) => candidate.permissions.map((permission) => permission.key)))),
    [roles]
  );
  const permissionLabelByKey = useMemo(
    () =>
      new Map(
        roles.flatMap((candidate) => candidate.permissions.map((permission) => [permission.key, permission.name] as const))
      ),
    [roles]
  );
  const selectedRoleRow = useMemo(() => roles.find((candidate) => normalizeRole(candidate.name) === normalizeRole(role)), [role, roles]);

  const defaultRoleId = roles[0]?.id ?? '';

  const loadAssignments = useCallback(async () => {
    if (!user) return;
    setAssignmentsLoading(true);
    try {
      const res = await getUserAssignments(user.id);
      const rows: AssignmentRow[] = res.assignments.map((a) => ({
        clientKey: newClientKey(),
        roleDefinitionId: a.roleDefinitionId,
        scopeType: a.scopeType,
        scopeId: a.scopeId ?? null,
      }));
      setAssignmentRows(rows);
      const org = res.assignments.find((a) => a.scopeType === 'organization');
      if (org) {
        const match = roles.find((r) => r.id === org.roleDefinitionId);
        if (match) {
          setRole(match.name);
        }
      }
    } catch {
      toast.error(copy.users.toast.accessLoadFailed);
      setAssignmentRows([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [user, roles]);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setRole(user.role || 'ContentTeam');
      setSelectedBrandIds(user.brandIds ?? []);
      setActiveTab('profile');
      void loadAssignments();
    }
  }, [open, user, loadAssignments]);

  const handleBrandToggle = (brandId: string, checked: boolean) => {
    setSelectedBrandIds((prev) =>
      checked ? [...prev, brandId] : prev.filter((id) => id !== brandId)
    );
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await updateUser(user.id, {
        name: name.trim() || undefined,
        role,
        brandIds: selectedBrandIds,
      });
      toast.success(copy.users.toast.userUpdated, {
        description: formatCopy(copy.users.toast.userUpdatedDescription, { name: updated.name || updated.email }),
      });
      onUserUpdated?.(updated);
      onOpenChange(false);
    } catch {
      toast.error(copy.users.toast.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccess = async () => {
    if (!user || !defaultRoleId) return;
    for (const row of assignmentRows) {
      if (row.scopeType === 'brand' && (!row.scopeId || row.scopeId.trim() === '')) {
        toast.error(copy.users.assignmentBrandRequired);
        return;
      }
    }
    setAccessSaving(true);
    try {
      await updateUserAssignments(user.id, toUserAssignmentsUpdatePayload(assignmentRows));
      const refreshed = await getUser(user.id);
      if (refreshed) {
        onUserUpdated?.(refreshed);
      }
      toast.success(copy.users.toast.accessUpdated);
      await loadAssignments();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(copy.users.toast.accessUpdateFailed, { description: message });
    } finally {
      setAccessSaving(false);
    }
  };

  const addAssignmentRow = () => {
    setAssignmentRows((prev) => [
      ...prev,
      {
        clientKey: newClientKey(),
        roleDefinitionId: defaultRoleId,
        scopeType: 'organization',
        scopeId: null,
      },
    ]);
  };

  const removeAssignmentRow = (clientKey: string) => {
    setAssignmentRows((prev) => prev.filter((r) => r.clientKey !== clientKey));
  };

  const updateRow = (clientKey: string, patch: Partial<Omit<AssignmentRow, 'clientKey'>>) => {
    setAssignmentRows((prev) =>
      prev.map((r) => {
        if (r.clientKey !== clientKey) return r;
        const next = { ...r, ...patch };
        if (next.scopeType === 'organization') {
          next.scopeId = null;
        }
        return next;
      })
    );
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[97vw] max-w-[1020px] sm:w-[94vw]">
        <DialogHeader>
          <DialogTitle>{copy.users.editUser}</DialogTitle>
          <DialogDescription>{copy.users.editUserDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg border border-input bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === 'profile' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {copy.users.tabProfile}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === 'access' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {copy.users.tabAccess}
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmitProfile}>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-user-email">{copy.users.email}</Label>
                <Input id="edit-user-email" value={user.email} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-user-name">{copy.users.name}</Label>
                <Input
                  id="edit-user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.users.name}
                />
              </div>
              <div className="grid gap-2">
                <Label>{copy.users.role}</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((item) => {
                    const isActive = normalizeRole(role) === normalizeRole(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRole(item.value)}
                        className={`rounded-md border px-3 py-1.5 text-sm transition ${
                          isActive
                            ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#174ea6]'
                            : 'border-input bg-white text-foreground hover:bg-muted'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-md border border-input overflow-x-auto bg-white">
                  <table className="w-full min-w-[780px] border-collapse">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-input">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Role
                        </th>
                        {permissionKeys.map((permissionKey) => (
                          <th
                            key={permissionKey}
                            className="px-3 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                            title={permissionLabelByKey.get(permissionKey) ?? permissionKey}
                          >
                            <div className="inline-flex items-center gap-1">
                              <span>{permissionLabelByKey.get(permissionKey) ?? permissionKey}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoleRow ? (
                        <tr className="border-b border-input/70 bg-primary/5">
                          <td className="px-3 py-2.5">
                            <div className="text-sm font-medium">
                              {roleLabelMap.get(normalizeRole(selectedRoleRow.name)) ?? selectedRoleRow.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{selectedRoleRow.key}</div>
                          </td>
                          {permissionKeys.map((permissionKey) => (
                            <td key={permissionKey} className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                                  selectedRoleRow.permissions.some((permission) => permission.key === permissionKey)
                                    ? 'bg-[#e8f0fe] text-[#174ea6]'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                                aria-label={`${permissionLabelByKey.get(permissionKey) ?? permissionKey}: ${
                                  selectedRoleRow.permissions.some((permission) => permission.key === permissionKey)
                                    ? 'allowed'
                                    : 'not allowed'
                                }`}
                              >
                                {selectedRoleRow.permissions.some((permission) => permission.key === permissionKey) ? '✓' : '–'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing permissions for the currently selected role.
                </p>
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  {copy.users.profileSaveOverwritesAssignmentsHint}
                </p>
              </div>
              <div className="grid gap-2">
                <Label>{copy.users.brandAccess}</Label>
                <ScrollArea className="h-[180px] rounded-md border border-input p-3 bg-white">
                  <div className="flex flex-col gap-2">
                    {brands.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{copy.users.brandsPlaceholder}</p>
                    ) : (
                      brands.map((brand) => (
                        <label
                          key={brand.id}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={selectedBrandIds.includes(brand.id)}
                            onCheckedChange={(checked) =>
                              handleBrandToggle(brand.id, checked === true)
                            }
                          />
                          <span>{brand.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {copy.common.cancel}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {copy.users.saving}
                  </>
                ) : (
                  copy.common.save
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">{copy.users.accessTabDescription}</p>
            {assignmentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No role definitions available.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-input overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/40 border-b border-input">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{copy.users.assignmentRole}</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{copy.users.assignmentScope}</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{copy.users.assignmentBrand}</th>
                        <th className="px-3 py-2 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentRows.map((row) => (
                        <tr key={row.clientKey} className="border-b border-input/60 last:border-0">
                          <td className="px-3 py-2 align-middle">
                            <select
                              className="w-full max-w-[220px] rounded-md border border-input bg-white px-2 py-1.5"
                              value={row.roleDefinitionId}
                              onChange={(e) => updateRow(row.clientKey, { roleDefinitionId: e.target.value })}
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.key})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 align-middle">
                            <select
                              className="w-full max-w-[180px] rounded-md border border-input bg-white px-2 py-1.5"
                              value={row.scopeType}
                              onChange={(e) =>
                                updateRow(row.clientKey, {
                                  scopeType: e.target.value as 'organization' | 'brand',
                                })
                              }
                            >
                              <option value="organization">{copy.users.scopeOrganization}</option>
                              <option value="brand">{copy.users.scopeBrand}</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {row.scopeType === 'brand' ? (
                              <select
                                className="w-full max-w-[220px] rounded-md border border-input bg-white px-2 py-1.5"
                                value={row.scopeId ?? ''}
                                onChange={(e) => updateRow(row.clientKey, { scopeId: e.target.value || null })}
                              >
                                <option value="">—</option>
                                {brands.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeAssignmentRow(row.clientKey)}
                            >
                              {copy.users.removeAssignment}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addAssignmentRow} disabled={!defaultRoleId}>
                  {copy.users.addAssignment}
                </Button>
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={accessSaving}>
                {copy.common.cancel}
              </Button>
              <Button type="button" onClick={() => void handleSaveAccess()} disabled={accessSaving || assignmentsLoading || !defaultRoleId}>
                {accessSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {copy.users.saving}
                  </>
                ) : (
                  copy.users.saveAccess
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
