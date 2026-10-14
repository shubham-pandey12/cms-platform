'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  createRedirect,
  deleteRedirect,
  getRedirects,
  updateRedirect,
} from '@/services/api/redirectsApi';
import type { Redirect } from '@/types/cms';
import { copy } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';

const rc = copy.brands.redirectsPage;

export default function BrandRedirectsPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const { user } = useAuth();

  const isAdmin = user?.role != null && String(user.role).toLowerCase() === 'admin';

  const [rows, setRows] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formStatus, setFormStatus] = useState<'301' | '302'>('301');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Redirect | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin || !brandId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getRedirects(brandId);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) toast.error(rc.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, brandId]);

  const openCreate = () => {
    setEditing(null);
    setFormFrom('');
    setFormTo('');
    setFormStatus('301');
    setDialogOpen(true);
  };

  const openEdit = (r: Redirect) => {
    setEditing(r);
    setFormFrom(r.from);
    setFormTo(r.to);
    setFormStatus(r.status === 302 ? '302' : '301');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const statusNum = formStatus === '302' ? 302 : 301;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateRedirect(brandId, editing.id, {
          from: formFrom,
          to: formTo,
          status: statusNum as 301 | 302,
        });
        setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createRedirect(brandId, {
          from: formFrom,
          to: formTo,
          status: statusNum as 301 | 302,
        });
        setRows((prev) => [...prev, created].sort((a, b) => a.from.localeCompare(b.from)));
      }
      toast.success(rc.saved);
      setDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(rc.loadFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRedirect(brandId, deleteTarget.id);
      setRows((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success(rc.deleted);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      toast.error(rc.loadFailed);
    } finally {
      setDeleting(false);
    }
  };

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/builder/${brandId}` as Route}>{rc.openBuilder}</Link>
      </Button>
      <Button size="sm" className="bg-[#1a73e8] hover:bg-[#1557b0]" onClick={openCreate}>
        <Plus className="mr-1 h-4 w-4" aria-hidden />
        {rc.add}
      </Button>
    </div>
  );

  return (
    <AdminShell requirePermission={(u) => u?.role != null && String(u.role).toLowerCase() === 'admin'}>
      <PageHeader
        title={rc.title}
        description={rc.description}
        actions={pageActions}
      />

      {/* Breadcrumb back link */}
      <div className="border-b border-gray-100 bg-white px-4 py-2 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="h-7 px-0 text-[#5f6368] hover:bg-transparent hover:text-[#202124]">
          <Link href={'/brands' as Route} className="flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {rc.backToBrands}
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5f6368]" aria-hidden />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <p className="text-sm text-[#5f6368]">{rc.empty}</p>
            <Button size="sm" className="mt-4 bg-[#1a73e8] hover:bg-[#1557b0]" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" aria-hidden />
              {rc.add}
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#f8f9fa]">
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="font-medium text-[#5f6368]">{rc.from}</TableHead>
                  <TableHead className="font-medium text-[#5f6368]">{rc.to}</TableHead>
                  <TableHead className="w-[120px] font-medium text-[#5f6368]">{rc.status}</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-gray-200 hover:bg-[#f8f9fa]">
                    <TableCell className="font-mono text-sm text-[#202124]">{r.from}</TableCell>
                    <TableCell className="break-all font-mono text-sm text-[#202124]">{r.to}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-[#f1f3f4] px-2 py-0.5 text-xs font-medium text-[#3c4043]">
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#5f6368] hover:text-[#202124]"
                        onClick={() => openEdit(r)}
                        aria-label={rc.edit}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(r)}
                        aria-label={rc.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? rc.edit : rc.add}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="redirect-from">
                {rc.from}
              </label>
              <Input
                id="redirect-from"
                value={formFrom}
                onChange={(e) => setFormFrom(e.target.value)}
                placeholder="/old-path"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="redirect-to">
                {rc.to}
              </label>
              <Input
                id="redirect-to"
                value={formTo}
                onChange={(e) => setFormTo(e.target.value)}
                placeholder="/new-path or https://..."
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">{rc.status}</span>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as '301' | '302')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">{rc.status301}</SelectItem>
                  <SelectItem value="302">{rc.status302}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {rc.cancel}
            </Button>
            <Button
              className="bg-[#1a73e8] hover:bg-[#1557b0]"
              disabled={saving || !formFrom.trim() || !formTo.trim()}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : rc.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{rc.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{rc.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{rc.cancel}</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : rc.delete}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
