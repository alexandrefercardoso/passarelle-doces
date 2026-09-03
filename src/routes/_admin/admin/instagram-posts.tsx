"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  adminDeleteInstagramPost,
  adminInsertInstagramPost,
  adminUpdateInstagramPost,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { InstagramPost } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/instagram-posts")({
  component: AdminInstagramPostsPage,
});

function AdminInstagramPostsPage() {
  const { instagramPosts, loading, refresh } = useAdminData();
  const [editing, setEditing] = useState<InstagramPost | null>(null);
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
            Posts do Instagram
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Imagens exibidas na seção "Siga a Passarelli Doces" da página inicial.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Novo post
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {instagramPosts.length === 0 ? (
          <EmptyState
            icon={Instagram}
            title="Nenhum post"
            description="Adicione as primeiras imagens da seção do Instagram."
            action={
              <Button className="rounded-full" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Adicionar post
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Link do post</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instagramPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-cream">
                        <ProductImage
                          src={post.imageUrl}
                          alt="Post do Instagram"
                          emoji="📸"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-muted-foreground">
                      {post.linkUrl && post.linkUrl !== "#" ? post.linkUrl : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{post.sortOrder}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          post.isActive
                            ? "bg-chocolate/10 text-chocolate"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {post.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar post"
                          onClick={() => setEditing(post)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir post"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm("Excluir este post do Instagram?")) {
                              void adminDeleteInstagramPost(post.id).then((res) =>
                                afterMutation(res, "Post excluído"),
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
        <InstagramPostForm
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={async (data, id) => {
            const res = id
              ? await adminUpdateInstagramPost({ ...data, id })
              : await adminInsertInstagramPost({ ...data, id: crypto.randomUUID() });
            await afterMutation(res, id ? "Post atualizado" : "Post criado");
          }}
        />
      )}
    </div>
  );
}

type InstagramPostFormValues = Omit<InstagramPost, "id">;

function InstagramPostForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: InstagramPost | null;
  onClose: () => void;
  onSubmit: (data: InstagramPostFormValues, id: string | null) => Promise<void>;
}) {
  const [form, setForm] = useState<InstagramPostFormValues>({
    imageUrl: initial?.imageUrl ?? "",
    linkUrl: initial?.linkUrl ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof InstagramPostFormValues>(key: K, value: InstagramPostFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) return;
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
          <DialogTitle>{initial ? "Editar post" : "Novo post do Instagram"}</DialogTitle>
          <DialogDescription>
            Adicione uma imagem que aparecerá na seção "Siga a Passarelli Doces".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <ImagePicker
            label="Imagem do post *"
            value={form.imageUrl}
            onChange={(url) => set("imageUrl", url)}
            folder="instagram"
          />
          <Field label="Link do post (URL do Instagram)">
            <Input
              value={form.linkUrl}
              onChange={(e) => set("linkUrl", e.target.value)}
              placeholder="https://instagram.com/p/..."
            />
          </Field>
          <Field label="Ordem de exibição">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
            />
          </Field>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Post ativo</p>
              <p className="text-xs text-muted-foreground">Visível na página inicial</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !form.imageUrl.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : initial ? (
                "Salvar alterações"
              ) : (
                "Adicionar post"
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
