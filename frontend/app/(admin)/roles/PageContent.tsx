'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  createRole,
  deleteRole,
  getRolePermissionsCatalog,
  getRoles,
  updateRoleMetadata,
  updateRolePermissions,
} from '@/services/cmsApiService';
import type { RbacPermission, RbacRoleDefinition } from '@/types/cms';
import { userCanManageRoles } from '@/lib/rbacPermissions';
import { copy, formatCopy } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';

export default function RolesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [roles, setRoles] = useState<RbacRoleDefinition[]>([]);
  const [catalog, setCatalog] = useState<RbacPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMetaOpen, setEditMetaOpen] = useState(false);
  const [editPermsOpen, setEditPermsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RbacRoleDefinition | null>(null);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createKey, setCreateKey] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const canManage = userCanManageRoles(user);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, permList] = await Promise.all([getRoles(), getRolePermissionsCatalog()]);
      setRoles(roleList.map((r) => ({ ...r, isSystem: r.isSystem ?? false })));
      setCatalog(permList);
    } catch (e) {
      console.error(e);
      toast.error(copy.roleStudio.toastLoadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname ?? '/roles')}`);
    }
  }, [authLoading, user, router, pathname]);

  useEffect(() => {
    if (!authLoading && user && !canManage) {
      router.replace('/brands');
    }
  }, [authLoading, user, canManage, router]);

  useEffect(() => {
    if (user && canManage) {
      void load();
    }
  }, [user, canManage, load]);

  const openEditPermissions = (role: RbacRoleDefinition) => {
    setSelectedRole(role);
    setSelectedPermissionKeys(new Set(role.permissions.map((p) => p.key)));
    setEditPermsOpen(true);
  };

  const openEditMeta = (role: RbacRoleDefinition) => {
    setSelectedRole(role);
    setEditName(role.name);
    setEditDescription(role.description ?? '');
    setEditMetaOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const updated = await updateRolePermissions(selectedRole.id, [...selectedPermissionKeys]);
      setRoles((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...updated, isSystem: updated.isSystem ?? true } : r))
      );
      toast.success(copy.roleStudio.toastPermsUpdated);
      setEditPermsOpen(false);
    } catch {
      toast.error(copy.roleStudio.toastPermsFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const updated = await updateRoleMetadata(selectedRole.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setRoles((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...updated, isSystem: updated.isSystem ?? true } : r))
      );
      toast.success(copy.roleStudio.toastMetaUpdated);
      setEditMetaOpen(false);
    } catch {
      toast.error(copy.roleStudio.toastMetaFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error(copy.roleStudio.toastNameRequired);
      return;
    }
    setSaving(true);
    try {
      const created = await createRole({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        key: createKey.trim() || undefined,
        permissionKeys: [],
      });
      setRoles((prev) =>
        [...prev, { ...created, isSystem: created.isSystem ?? false }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      toast.success(copy.roleStudio.toastCreated);
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      setCreateKey('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : copy.roleStudio.toastMetaFailed;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RbacRoleDefinition) => {
    if (role.isSystem) return;
    if (!window.confirm(formatCopy(copy.roleStudio.deleteConfirm, { name: role.name }))) return;
    setSaving(true);
    try {
      await deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      toast.success(copy.roleStudio.toastDeleted);
    } catch {
      toast.error(copy.roleStudio.deleteBlockedToast);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: string, checked: boolean) => {
    setSelectedPermissionKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const orgPerms = catalog.filter((p) => p.isOrganizationLevel);
  const brandPerms = catalog.filter((p) => !p.isOrganizationLevel);

  const pageActions = (
    <Button
      onClick={() => setCreateOpen(true)}
      className="bg-[#1a73e8] hover:bg-[#1557b0]"
    >
      <Plus className="mr-1.5 h-4 w-4" aria-hidden />
      {copy.roleStudio.createRole}
    </Button>
  );

  return (
    <AdminShell requirePermission={(u) => userCanManageRoles(u)}>
      <PageHeader
        title={copy.roleStudio.title}
        description={copy.roleStudio.description}
        actions={loading ? undefined : pageActions}
      />

      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#f8f9fa]">
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="font-medium text-[#5f6368]">{copy.roleStudio.tableName}</TableHead>
                  <TableHead className="font-medium text-[#5f6368]">{copy.roleStudio.tableKey}</TableHead>
                  <TableHead className="font-medium text-[#5f6368]">{copy.roleStudio.tableType}</TableHead>
                  <TableHead className="text-right font-medium text-[#5f6368]">
                    {copy.roleStudio.tablePermissionCount}
                  </TableHead>
                  <TableHead className="w-[220px] font-medium text-[#5f6368]">
                    {copy.roleStudio.tableActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-[#5f6368]">
                      {copy.roleStudio.tableEmpty}
                    </TableCell>
                  </TableRow>
                ) : null}
                {roles.map((role) => (
                  <TableRow key={role.id} className="border-gray-200 hover:bg-[#f8f9fa]">
                    <TableCell className="font-medium text-[#202124]">{role.name}</TableCell>
                    <TableCell className="font-mono text-sm text-[#5f6368]">{role.key}</TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="secondary" className="rounded-md bg-[#f1f3f4] text-[#3c4043]">
                          {copy.roleStudio.systemType}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="rounded-md border-[#d2e3fc] bg-[#e8f0fe] text-[#174ea6]"
                        >
                          {copy.roleStudio.customType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#5f6368]">
                      {role.permissions.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[#5f6368] hover:text-[#202124]"
                          onClick={() => openEditPermissions(role)}
                        >
                          <Shield className="mr-1 h-4 w-4" />
                          {copy.roleStudio.permissionsAction}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[#5f6368] hover:text-[#202124]"
                          onClick={() => openEditMeta(role)}
                        >
                          {copy.roleStudio.editAction}
                        </Button>
                        {!role.isSystem ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(role)}
                            aria-label={formatCopy(copy.roleStudio.deleteAriaLabel, { name: role.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create role dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.roleStudio.dialogCreateTitle}</DialogTitle>
            <DialogDescription>{copy.roleStudio.dialogCreateDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cr-name">{copy.roleStudio.labelName}</Label>
              <Input id="cr-name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cr-desc">{copy.roleStudio.labelDescription}</Label>
              <Input
                id="cr-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cr-key">{copy.roleStudio.labelKeyOptional}</Label>
              <Input
                id="cr-key"
                value={createKey}
                onChange={(e) => setCreateKey(e.target.value)}
                placeholder={copy.roleStudio.keyPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {copy.common.cancel}
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                copy.roleStudio.dialogCreateSubmit
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit metadata dialog */}
      <Dialog open={editMetaOpen} onOpenChange={setEditMetaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.roleStudio.dialogEditTitle}</DialogTitle>
            <DialogDescription>{copy.roleStudio.dialogEditDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="em-name">{copy.roleStudio.labelName}</Label>
              <Input id="em-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="em-desc">{copy.roleStudio.labelDescription}</Label>
              <Input
                id="em-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMetaOpen(false)}>
              {copy.common.cancel}
            </Button>
            <Button onClick={() => void handleSaveMeta()} disabled={saving}>
              {copy.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit permissions dialog */}
      <Dialog open={editPermsOpen} onOpenChange={setEditPermsOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRole
                ? formatCopy(copy.roleStudio.permissionsDialogTitle, { name: selectedRole.name })
                : copy.roleStudio.permissionsAction}
            </DialogTitle>
            <DialogDescription>{copy.roleStudio.dialogPermsDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5f6368]">
                {copy.roleStudio.orgPermissionGroup}
              </p>
              <div className="space-y-2">
                {orgPerms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedPermissionKeys.has(p.key)}
                      onCheckedChange={(v) => togglePermission(p.key, v === true)}
                    />
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">({p.key})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5f6368]">
                {copy.roleStudio.brandPermissionGroup}
              </p>
              <div className="space-y-2">
                {brandPerms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedPermissionKeys.has(p.key)}
                      onCheckedChange={(v) => togglePermission(p.key, v === true)}
                    />
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">({p.key})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermsOpen(false)}>
              {copy.common.cancel}
            </Button>
            <Button onClick={() => void handleSavePermissions()} disabled={saving}>
              {copy.roleStudio.savePermissions}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
