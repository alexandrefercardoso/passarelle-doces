"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/store/empty-state";
import { useAdminData } from "@/hooks/use-admin-data";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const afterMutation = async (res: { ok: boolean; error?: string }, message: string) => {
    if (!res.ok) {
      toast.error(message, { description: res.error ?? "Não foi possível salvar. Tente novamente." });
      return;
    }
    toast.success(message, { description: "Salvo no banco de dados." });
    await refresh();
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await adminDeleteProduct(id);
    await afterMutation(res, "Produto excluído");
    setDeletingId(null);
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} produtos no catálogo.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto"
            description="Crie seu primeiro produto para começar a vender."
            action={
              <Button className="rounded-full" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Criar produto
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="max-w-[240px]">
                        <p className="truncate font-medium text-foreground">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">/produtos/{p.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {categoryName(p.categoryId)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-chocolate-dark">
                        {formatCurrency(p.price)}
                      </span>
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(p.compareAtPrice)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{p.stock}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          p.isActive
                            ? "bg-chocolate/10 text-chocolate"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {p.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
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
                          disabled={deletingId === p.id}
                          onClick={() => {
                            if (window.confirm(`Excluir "${p.name}"?`)) {
                              void handleDelete(p.id);
                            }
                          }}
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
        <ProductForm
          categories={categories}
          initial={editing}
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
  const [badgesText, setBadgesText] = useState((initial?.badges ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.name);
      await onSubmit(
        {
          ...form,
          slug,
          compareAtPrice:
            form.compareAtPrice && form.compareAtPrice > 0 ? form.compareAtPrice : null,
          badges: badgesText
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean),
        },
        initial?.id ?? null,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Atualize as informações e salve para publicar."
              : "Cadastre um novo docinho no catálogo da loja."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome *" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!initial) set("slug", slugify(e.target.value));
                }}
                placeholder="Brigadeiro Gourmet"
                required
              />
            </Field>
            <Field label="Slug (URL)">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="brigadeiro-gourmet"
              />
            </Field>
            <Field label="Categoria">
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha" />
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
            <Field label="Preço (R$) *">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="Preço promocional (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.compareAtPrice ?? ""}
                onChange={(e) =>
                  set("compareAtPrice", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Deixe vazio se não houver"
              />
            </Field>
            <Field label="Estoque" className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
              />
            </Field>
            <Field label="Imagem (URL)" className="sm:col-span-2">
              <Input
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://.../foto.png (use assets ou Supabase Storage)"
              />
            </Field>
            <Field label="Badges (separadas por vírgula)" className="sm:col-span-2">
              <Input
                value={badgesText}
                onChange={(e) => setBadgesText(e.target.value)}
                placeholder="Gourmet, Novidade"
              />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Conte um pouco sobre esse doce..."
            />
          </Field>

          <div className="space-y-3 rounded-2xl border border-border p-4">
            <ToggleRow
              label="Produto ativo"
              hint="Visível na loja"
              checked={form.isActive}
              onChange={(v) => set("isActive", v)}
            />
            <ToggleRow
              label="Mais vendido"
              hint="Exibido na seção de queridinhos"
              checked={form.isBestSeller}
              onChange={(v) => set("isBestSeller", v)}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
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

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
