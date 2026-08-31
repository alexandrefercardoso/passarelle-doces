"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminData } from "@/hooks/use-admin-data";
import { ImagePicker } from "@/components/admin/image-picker";
import { adminDeleteProduct, adminInsertProduct, adminUpdateProduct } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency, slugify } from "@/lib/format";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/produtos")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const { products, categories, loading, refresh } = useAdminData();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const afterMutation = async (
    res: { ok: boolean; error?: string },
    message: string,
    close = true,
  ) => {
    if (!res.ok) {
      toast.error(message, {
        description: res.error ?? "Não foi possível salvar. Tente novamente.",
      });
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

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os produtos da loja: preços, estoque e destaque.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Estoque</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            🧁
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{p.name}</p>
                        {p.isBestSeller && (
                          <span className="text-[10px] font-bold text-gold-dark">Mais vendido</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{categoryName(p.categoryId)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-chocolate-dark">
                      {formatCurrency(p.price)}
                    </span>
                    {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                      <span className="ml-1.5 text-xs text-muted-foreground line-through">
                        {formatCurrency(p.compareAtPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        p.isActive
                          ? "bg-chocolate/10 text-chocolate"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {p.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar produto"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir produto"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Excluir o produto "${p.name}"?`)) {
                            void adminDeleteProduct(p.id).then((res) =>
                              afterMutation(res, "Produto excluído"),
                            );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <Tags className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Novo produto&quot; para adicionar o primeiro.
            </p>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <ProductForm
          initial={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={async (data, id) => {
            const res = id
              ? await adminUpdateProduct({ ...data, id })
              : await adminInsertProduct({ ...data, id: crypto.randomUUID() });
            await afterMutation(res, id ? "Produto atualizado" : "Produto criado");
          }}
        />
      )}
    </div>
  );
}

type ProductFormValues = Omit<Product, "id">;

function ProductForm({
  initial,
  categories,
  onClose,
  onSubmit,
}: {
  initial: Product | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (data: ProductFormValues, id: string | null) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductFormValues>({
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    compareAtPrice: initial?.compareAtPrice ?? null,
    imageUrl: initial?.imageUrl ?? "",
    gallery: initial?.gallery ?? [],
    stock: initial?.stock ?? 0,
    isActive: initial?.isActive ?? true,
    isBestSeller: initial?.isBestSeller ?? false,
    salesCount: initial?.salesCount ?? 0,
    badges: initial?.badges ?? [],
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true);
    try {
      await onSubmit(
        { ...form, slug: form.slug || slugify(form.name), price: Number(form.price) || 0 },
        initial?.id ?? null,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Atualize os dados do produto."
              : "Os produtos aparecem no catálogo da loja."}
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
            <Field label="Categoria *">
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço (R$) *">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
              />
            </Field>
            <Field label="Preço original (R$)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.compareAtPrice ?? ""}
                onChange={(e) =>
                  set("compareAtPrice", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Deixar vazio se não houver"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estoque">
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
              />
            </Field>
            <Field label="Etiquetas (separadas por vírgula)">
              <Input
                value={form.badges.join(", ")}
                onChange={(e) =>
                  set(
                    "badges",
                    e.target.value
                      .split(",")
                      .map((b) => b.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Novo, Promoção"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <ImagePicker
              label="Imagem do produto"
              value={form.imageUrl}
              onChange={(url) => set("imageUrl", url)}
              folder="produtos"
              kind="product"
            />
          </div>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Produto ativo</p>
                <p className="text-xs text-muted-foreground">Exibido no catálogo</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Mais vendido</p>
                <p className="text-xs text-muted-foreground">Destaque na loja</p>
              </div>
              <Switch checked={form.isBestSeller} onCheckedChange={(v) => set("isBestSeller", v)} />
            </div>
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
                "Criar produto"
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
