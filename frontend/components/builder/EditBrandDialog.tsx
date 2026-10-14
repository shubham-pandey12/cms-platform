'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brand } from '@/types/cms';
import { updateBrand, checkBrandAvailability, getBrandDomains, addBrandDomain, removeBrandDomain } from '@/services/cmsApiService';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { copy, formatCopy } from '@/lib/copy';

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

interface EditBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
  onBrandUpdated?: (brand: Brand) => void;
}

export const EditBrandDialog: React.FC<EditBrandDialogProps> = ({
  open,
  onOpenChange,
  brand,
  onBrandUpdated,
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [logo, setLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0891b2');
  const [secondaryColor, setSecondaryColor] = useState('#164e63');
  const [globalCss, setGlobalCss] = useState('');
  const [customFontUrlsText, setCustomFontUrlsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const availabilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    if (open && brand) {
      setName(brand.name);
      setDomain(brand.domain);
      setSubdomain(brand.subdomain ?? '');
      setLogo(brand.logo ?? '');
      setPrimaryColor(brand.primaryColor);
      setSecondaryColor(brand.secondaryColor);
      setGlobalCss(brand.globalCss ?? '');
      setCustomFontUrlsText((brand.customFontUrls ?? []).join('\n'));
      setError(null);
      setDomainAvailable(null);
      setSubdomainAvailable(null);
      setDomainError(null);
      setNewDomainInput('');
      setDomainsLoading(true);
      getBrandDomains(brand.id)
        .then(setDomains)
        .catch(() => setDomains([]))
        .finally(() => setDomainsLoading(false));
    }
  }, [open, brand]);

  useEffect(() => {
    if (!open || !brand) return;
    if (availabilityDebounceRef.current) clearTimeout(availabilityDebounceRef.current);
    const d = domain.trim();
    const s = subdomain.trim();
    if (!d && !s) {
      setDomainAvailable(null);
      setSubdomainAvailable(null);
      return;
    }
    availabilityDebounceRef.current = setTimeout(() => {
      availabilityDebounceRef.current = null;
      setIsCheckingAvailability(true);
      checkBrandAvailability({
        domain: d || null,
        subdomain: s || null,
        excludeBrandId: brand.id,
      })
        .then((r) => {
          setDomainAvailable(d ? r.domainAvailable : null);
          setSubdomainAvailable(s ? r.subdomainAvailable : null);
        })
        .finally(() => setIsCheckingAvailability(false));
    }, 500);
    return () => {
      if (availabilityDebounceRef.current) clearTimeout(availabilityDebounceRef.current);
    };
  }, [open, brand, domain, subdomain]);

  const validate = (): string | null => {
    if (!name.trim()) return copy.builder.createBrand.validation.nameRequired;
    if (!domain.trim()) return copy.builder.createBrand.validation.domainRequired;
    if (!subdomain.trim()) return copy.builder.createBrand.validation.subdomainRequired;
    if (domainAvailable === false) return copy.builder.createBrand.validation.domainTaken;
    if (subdomainAvailable === false) return copy.builder.createBrand.validation.subdomainTaken;
    if (!primaryColor.trim()) return copy.builder.createBrand.validation.primaryColorRequired;
    if (!HEX_REGEX.test(primaryColor)) return copy.builder.createBrand.validation.primaryColorInvalid;
    if (!secondaryColor.trim()) return copy.builder.createBrand.validation.secondaryColorRequired;
    if (!HEX_REGEX.test(secondaryColor)) return copy.builder.createBrand.validation.secondaryColorInvalid;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    const validationErr = validate();
    if (validationErr) {
      setError(validationErr);
      toast.error(validationErr);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const customFontUrls = customFontUrlsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateBrand(brand.id, {
        name: name.trim(),
        domain: domain.trim(),
        subdomain: subdomain.trim() || null,
        logo: logo.trim() || null,
        primaryColor: primaryColor.trim(),
        secondaryColor: secondaryColor.trim(),
        globalCss: globalCss.trim() || null,
        customFontUrls: customFontUrls.length > 0 ? customFontUrls : null,
      });

      if (updated) {
        toast.success(copy.brands.toast.brandUpdated, {
          description: formatCopy(copy.brands.toast.brandUpdatedDescription, { name: updated.name }),
        });
        onBrandUpdated?.(updated);
        onOpenChange(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.brands.toast.updateFailed;
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!brand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-brand-description">
        <DialogHeader>
          <DialogTitle>{copy.brands.editBrandTitle}</DialogTitle>
          <DialogDescription id="edit-brand-description">
            {copy.brands.editBrandDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-name">{copy.builder.createBrand.nameLabel}</Label>
              <Input
                id="edit-brand-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder={copy.builder.createBrand.namePlaceholder}
                maxLength={200}
                aria-required="true"
                aria-invalid={!!error}
              />
              <span className="text-xs text-muted-foreground">{copy.builder.createBrand.nameMaxHint}</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-domain">{copy.builder.createBrand.domainLabel}</Label>
              <Input
                id="edit-brand-domain"
                value={domain}
                onChange={(e) => { setDomain(e.target.value); setError(null); }}
                placeholder={copy.builder.createBrand.domainPlaceholder}
                maxLength={500}
                aria-required="true"
                aria-invalid={!!error || domainAvailable === false}
              />
              <span className="text-xs text-muted-foreground">{copy.builder.createBrand.domainHint}</span>
              {isCheckingAvailability && domain.trim() && (
                <span className="text-xs text-muted-foreground">Checking availability…</span>
              )}
              {!isCheckingAvailability && domain.trim() && domainAvailable === false && (
                <span className="text-xs text-destructive" role="alert">{copy.builder.createBrand.validation.domainTaken}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-subdomain">{copy.builder.createBrand.subdomainLabel}</Label>
              <Input
                id="edit-brand-subdomain"
                value={subdomain}
                onChange={(e) => { setSubdomain(e.target.value); setError(null); }}
                placeholder={copy.builder.createBrand.subdomainPlaceholder}
                maxLength={200}
                aria-required="true"
                aria-invalid={!!error || subdomainAvailable === false}
              />
              {!isCheckingAvailability && subdomain.trim() && subdomainAvailable === false && (
                <span className="text-xs text-destructive" role="alert">{copy.builder.createBrand.validation.subdomainTaken}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-logo">{copy.builder.createBrand.logoUrlLabel}</Label>
              <Input
                id="edit-brand-logo"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder={copy.builder.createBrand.logoUrlPlaceholder}
                maxLength={1000}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-brand-primary-color">{copy.builder.createBrand.primaryColorLabel}</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-brand-primary-color"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); setError(null); }}
                    placeholder={copy.builder.createBrand.primaryColorPlaceholder}
                    aria-required="true"
                    className="flex-1"
                  />
                  <div
                    className="w-10 h-10 rounded border border-border shrink-0"
                    style={{ backgroundColor: primaryColor }}
                    title={primaryColor}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-brand-secondary-color">{copy.builder.createBrand.secondaryColorLabel}</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-brand-secondary-color"
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => { setSecondaryColor(e.target.value); setError(null); }}
                    placeholder={copy.builder.createBrand.secondaryColorPlaceholder}
                    aria-required="true"
                    className="flex-1"
                  />
                  <div
                    className="w-10 h-10 rounded border border-border shrink-0"
                    style={{ backgroundColor: secondaryColor }}
                    title={secondaryColor}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-global-css">{copy.brands.editBrandGlobalCssLabel}</Label>
              <textarea
                id="edit-brand-global-css"
                value={globalCss}
                onChange={(e) => setGlobalCss(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="/* Custom CSS */"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-font-urls">{copy.brands.editBrandCustomFontUrlsLabel}</Label>
              <textarea
                id="edit-brand-font-urls"
                value={customFontUrlsText}
                onChange={(e) => setCustomFontUrlsText(e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://example.com/font.woff2"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Domains</Label>
              <p className="text-xs text-muted-foreground">
                Additional domains for this brand (e.g. www.example.com). Used for host-based site resolution.
              </p>
              {domainsLoading ? (
                <span className="text-xs text-muted-foreground">Loading domains…</span>
              ) : (
                <>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {domains.map((d) => (
                      <li key={d} className="flex items-center justify-between gap-2">
                        <span>{d}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!brand) return;
                            try {
                              await removeBrandDomain(brand.id, d);
                              setDomains((prev) => prev.filter((x) => x !== d));
                              toast.success('Domain removed');
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Failed to remove domain');
                            }
                          }}
                          aria-label={`Remove domain ${d}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                    {domains.length === 0 && (
                      <li className="text-muted-foreground">No additional domains. Primary domain is from the field above.</li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <Input
                      value={newDomainInput}
                      onChange={(e) => { setNewDomainInput(e.target.value); setDomainError(null); }}
                      placeholder="example.com or www.example.com"
                      maxLength={500}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (brand && newDomainInput.trim()) {
                            const domain = newDomainInput.trim();
                            addBrandDomain(brand.id, domain)
                              .then(() => {
                                setDomains((prev) => [...prev, domain.toLowerCase()]);
                                setNewDomainInput('');
                                setDomainError(null);
                                toast.success('Domain added');
                              })
                              .catch((err) => {
                                const msg = err instanceof Error ? err.message : 'Failed to add domain';
                                setDomainError(msg);
                                toast.error(msg);
                              });
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!newDomainInput.trim() || !brand}
                      onClick={async () => {
                        if (!brand || !newDomainInput.trim()) return;
                        setDomainError(null);
                        try {
                          await addBrandDomain(brand.id, newDomainInput.trim());
                          setDomains((prev) => [...prev, newDomainInput.trim().toLowerCase()]);
                          setNewDomainInput('');
                          toast.success('Domain added');
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : 'Failed to add domain';
                          setDomainError(msg);
                          toast.error(msg);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {domainError && (
                    <p className="text-xs text-destructive" role="alert">{domainError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-4" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {copy.common.cancel}
            </Button>
            <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {copy.brands.editBrandSaving}
                </>
              ) : (
                copy.common.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
