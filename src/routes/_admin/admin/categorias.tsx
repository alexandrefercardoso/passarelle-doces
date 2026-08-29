"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAdminData } from "@/hooks/use-admin-data";
import { adminDeleteCategory, adminInsertCategory, adminUpdateCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/categorias")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const { categories, loading, refresh } = useAdminData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const afterMutation = async (res: { ok: boolean }, message: string, close = true) => {
    if (!res.ok) {
      toast.error(message, { description: "Não foi possível salvar. Tente novamente." });
      return;
    }
    toast.success(message, { description: "Salvo no banco de dados." });
    await refresh();
    if (close) {
      setEditing(null);
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize os produtos e o menu de navegação da loja.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, index) => (
          <div
            key={c.id}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream font-display text-lg font-bold text-chocolate-dark">
                {index + 1}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar categoria"
                  onClick={() => setEditing(c)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir categoria"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Excluir a categoria "${c.name}"?`)) {
                      void adminDeleteCategory(c.id).then((res) =>
                        afterMutation(res, "Categoria excluída"),
                      );
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-foreground">{c.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={`/categoria/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gold-dark hover:underline"
              >
                Ver na loja <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  c.isActive
                    ? "bg-chocolate/10 text-chocolate"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {c.isActive ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <CategoryForm
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={async (data, id) => {
            const res = id
              ? await adminUpdateCategory({ ...data, id })
              : await adminInsertCategory({ ...data, id: crypto.randomUUID() });
            await afterMutation(res, id ? "Categoria atualizada" : "Categoria criada");
          }}
        />
      )}
    </div>
  );
}

type CategoryFormValues = Omit<Category, "id">;

function CategoryForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Category | null;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues, id: string | null) => Promise<void>;
}) {
  const [form, setForm] = useState<CategoryFormValues>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, slug: form.slug || slugify(form.name) }, initial?.id ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Atualize os dados da categoria."
              : "As categorias aparecem no menu e na página inicial."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome *" className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!initial) set("slug", slugify(e.target.value));
              }}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug (URL)">
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label="Ordem">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Imagem (URL)" className="sm:col-span-2">
            <Input
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://.../categoria.png"
            />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Categoria ativa</p>
              <p className="text-xs text-muted-foreground">Exibida no menu e nas páginas</p>
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
                "Criar categoria"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
