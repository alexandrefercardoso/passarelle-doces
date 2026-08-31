"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/store/empty-state";
import { ProductImage } from "@/components/store/product-image";
import { ImagePicker } from "@/components/admin/image-picker";
import { useAdminData } from "@/hooks/use-admin-data";
import { adminDeleteBanner, adminInsertBanner, adminUpdateBanner } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/banners")({
  component: AdminBannersPage,
});

function AdminBannersPage() {
  const { banners, loading, refresh } = useAdminData();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);

  const afterMutation = async (res: { ok: boolean; error?: string }, message: string) => {
    if (!res.ok) {
      toast.error(message, {
        description: res.error ?? "Não foi possível salvar. Tente novamente.",
      });
      return;
    }
    toast.success(message, { description: "Salvo no banco de dados." });
    await refresh();
    setEditing(null);
    setCreating(false);
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Banners
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Slides do banner principal da página inicial. Ordem e ativação são controladas aqui.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Novo banner
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {banners.length === 0 ? (
          <EmptyState
            icon={BadgePercent}
            title="Nenhum banner"
            description="Crie o primeiro slide de destaque da sua loja."
            action={
              <Button className="rounded-full" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Criar banner
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="h-12 w-20 overflow-hidden rounded-lg bg-cream">
                        <ProductImage src={b.imageUrl} alt={b.title} emoji="🍰" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{b.title}</p>
                      {b.subtitle && (
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {b.subtitle}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">
                      {b.linkUrl}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.sortOrder}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          b.isActive
                            ? "bg-chocolate/10 text-chocolate"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {b.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar banner"
                          onClick={() => setEditing(b)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir banner"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Excluir o banner "${b.title}"?`)) {
                              void adminDeleteBanner(b.id).then((res) =>
                                afterMutation(res, "Banner excluído"),
                              );
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <BannerForm
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={async (data, id) => {
            const res = id
              ? await adminUpdateBanner({ ...data, id })
              : await adminInsertBanner({ ...data, id: crypto.randomUUID() });
            await afterMutation(res, id ? "Banner atualizado" : "Banner criado");
          }}
        />
      )}
    </div>
  );
}

type BannerFormValues = Omit<Banner, "id">;

function BannerForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Banner | null;
  onClose: () => void;
  onSubmit: (data: BannerFormValues, id: string | null) => Promise<void>;
}) {
  const [form, setForm] = useState<BannerFormValues>({
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    imageUrl: initial?.imageUrl ?? "",
    buttonText: initial?.buttonText ?? "Ver Produtos",
    linkUrl: initial?.linkUrl ?? "/produtos",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form, initial?.id ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar banner" : "Novo banner"}</DialogTitle>
          <DialogDescription>Configure o slide exibido no carrossel principal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Título *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </Field>
          <Field label="Subtítulo">
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <ImagePicker
            label="Imagem do banner"
            value={form.imageUrl}
            onChange={(url) => set("imageUrl", url)}
            folder="banners"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto do botão">
              <Input value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
            </Field>
            <Field label="Ordem">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Link de destino">
            <Input
              value={form.linkUrl}
              onChange={(e) => set("linkUrl", e.target.value)}
              placeholder="/produtos ou /categoria/chocolates"
            />
          </Field>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Banner ativo</p>
              <p className="text-xs text-muted-foreground">Exibido no carrossel da loja</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : initial ? (
                "Salvar alterações"
              ) : (
                "Criar banner"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
