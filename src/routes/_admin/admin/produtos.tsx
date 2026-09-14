"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Copy,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  Tags,
  Trash2,
} from "lucide-react";
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
import {
  printProductCatalog,
  printProductCheckReport,
  printProductMinStockReport,
  printProductSalesCatalog,
} from "@/components/admin/print-report";
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
  const [cloning, setCloning] = useState<ProductFormValues | null>(null);

  const closeForms = () => {
    setEditing(null);
    setCreating(false);
    setCloning(null);
  };

  const uniqueCloneSlug = (base: string) => {
    const taken = new Set(products.map((p) => p.slug));
    let candidate = `${base}-copia`;
    let i = 2;
    while (taken.has(candidate)) {
      candidate = `${base}-copia-${i}`;
      i += 1;
    }
    return candidate;
  };

  const cloneInto = (p: Product): ProductFormValues => ({
    categoryId: p.categoryId,
    name: `${p.name} (cópia)`,
    slug: uniqueCloneSlug(p.slug),
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    imageUrl: p.imageUrl,
    gallery: p.gallery,
    stock: p.stock,
    minimumStock: p.minimumStock,
    barcode: p.barcode,
    unitLabel: p.unitLabel,
    isActive: p.isActive,
    isBestSeller: p.isBestSeller,
    salesCount: 0,
    badges: p.badges,
  });

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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => printProductCatalog(products, categories)}
          >
            <Printer className="h-4 w-4" /> Relatório A4
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => printProductCheckReport(products, categories)}
          >
            <ClipboardCheck className="h-4 w-4" /> Conferência
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => printProductMinStockReport(products, categories)}
          >
            <PackageCheck className="h-4 w-4" /> Estoque mínimo
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-gold/60 text-chocolate hover:bg-gold/10"
            onClick={() => printProductSalesCatalog(products, categories)}
          >
            <BookOpen className="h-4 w-4" /> Catálogo de vendas
          </Button>
          <Button className="rounded-full" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        </div>
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
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "font-semibold",
                        p.minimumStock > 0 && p.stock <= p.minimumStock
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {p.stock}
                    </span>
                    {p.minimumStock > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        / mín. {p.minimumStock}
                      </span>
                    )}
                    {p.minimumStock > 0 && p.stock <= p.minimumStock && (
                      <span className="mt-0.5 block text-[10px] font-bold text-destructive">
                        Estoque baixo
                      </span>
                    )}
                  </td>
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
                        aria-label="Clonar produto"
                        title="Clonar produto"
                        onClick={() => {
                          setEditing(null);
                          setCreating(false);
                          setCloning(cloneInto(p));
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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

      {(creating || editing || cloning) && (
        <ProductForm
          initial={cloning ?? editing}
          editId={editing?.id ?? null}
          isClone={!!cloning}
          categories={categories}
          onClose={closeForms}
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
  editId = null,
  isClone = false,
}: {
  initial: Omit<Product, "id"> | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (data: ProductFormValues, id: string | null) => Promise<void>;
  editId?: string | null;
  isClone?: boolean;
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
    minimumStock: initial?.minimumStock ?? 0,
    barcode: initial?.barcode ?? "",
    unitLabel: initial?.unitLabel ?? "",
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
        editId,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isClone ? "Clonar produto" : initial ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            {isClone
              ? "Uma cópia fiel será criada como um novo produto."
              : initial
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
          <div className="grid gap-4 sm:grid-cols-3">
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
            <Field label="Unidade de medida">
              <Select
                value={form.unitLabel ?? "none"}
                onValueChange={(v) => set("unitLabel", v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="un">UN — Unidade</SelectItem>
                  <SelectItem value="pct">PCT — Pacote</SelectItem>
                  <SelectItem value="cx">CX — Caixa</SelectItem>
                  <SelectItem value="pote">Pote</SelectItem>
                  <SelectItem value="cent">Cento</SelectItem>
                  <SelectItem value="duzia">Dúzia</SelectItem>
                  <SelectItem value="kg">KG — Quilograma</SelectItem>
                  <SelectItem value="g">G — Grama</SelectItem>
                  <SelectItem value="litro">L — Litro</SelectItem>
                  <SelectItem value="ml">ML — Mililitro</SelectItem>
                  <SelectItem value="fatia">Fatia</SelectItem>
                  <SelectItem value="pedaco">Pedação</SelectItem>
                  <SelectItem value="bandeja">Bandeja</SelectItem>
                  <SelectItem value="torta">Torta</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Aparece junto ao preço (ex.: R$ 3,00/un).
              </p>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Estoque">
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
              />
            </Field>
            <Field label="Estoque mínimo">
              <Input
                type="number"
                min="0"
                value={form.minimumStock}
                onChange={(e) => set("minimumStock", Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground">
                Alerta quando o estoque estiver abaixo.
              </p>
            </Field>
            <Field label="Código de barras">
              <Input
                value={form.barcode ?? ""}
                onChange={(e) => set("barcode", e.target.value || null)}
                placeholder="Ex.: 7890000000000"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
              ) : isClone ? (
                "Criar cópia"
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
