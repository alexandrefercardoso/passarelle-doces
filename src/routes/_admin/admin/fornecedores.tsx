"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  Cake,
  CalendarDays,
  CheckCircle2,
  Cookie,
  CreditCard,
  Headphones,
  Loader2,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Users,
  XCircle,
  Wrench,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/fornecedores")({
  component: AdminFornecedoresPage,
});

const STORAGE_KEY = "passarelli_fornecedores";

type FornecedorStatus = "ativo" | "inativo" | "pendente";
type FornecedorCategoria =
  "ingredientes" | "embalagens" | "equipamentos" | "servicos" | "limpeza" | "outros";

type Fornecedor = {
  id: string;
  nome: string;
  empresa: string;
  categoria: FornecedorCategoria;
  telefone: string;
  email: string;
  whatsapp: string;
  cnpj: string;
  endereco: string;
  status: FornecedorStatus;
  observacao: string;
  valorMedioCompra: number;
  dataPagamento: string | null;
  valorUltimoPagamento: number;
  createdAt: string;
};

const CATEGORIAS: Record<
  FornecedorCategoria,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  ingredientes: {
    label: "Ingredientes",
    className: "bg-amber-100 text-amber-700",
    icon: Cookie,
  },
  embalagens: {
    label: "Embalagens",
    className: "bg-sky-100 text-sky-700",
    icon: Package,
  },
  equipamentos: {
    label: "Equipamentos",
    className: "bg-purple-100 text-purple-700",
    icon: Wrench,
  },
  servicos: {
    label: "Serviços",
    className: "bg-teal-100 text-teal-700",
    icon: Headphones,
  },
  limpeza: {
    label: "Limpeza",
    className: "bg-blue-100 text-blue-700",
    icon: Sparkles,
  },
  outros: {
    label: "Outros",
    className: "bg-gray-100 text-gray-700",
    icon: Truck,
  },
};

const STATUS_CONFIG: Record<
  FornecedorStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  ativo: {
    label: "Ativo",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700",
  },
  inativo: {
    label: "Inativo",
    icon: XCircle,
    className: "bg-gray-100 text-gray-600",
  },
  pendente: {
    label: "Pendente",
    icon: ShieldCheck,
    className: "bg-amber-100 text-amber-700",
  },
};

function readStorage(): Fornecedor[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Fornecedor[];
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function AdminFornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"todos" | FornecedorStatus>("todos");
  const [filterCategoria, setFilterCategoria] = useState<"todas" | FornecedorCategoria>("todas");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [pagando, setPagando] = useState<Fornecedor | null>(null);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fornecedores));
    }
  }, [fornecedores, loaded]);

  useEffect(() => {
    setFornecedores(readStorage());
    setLoaded(true);
  }, []);

  const resumo = useMemo(() => {
    const total = fornecedores.length;
    const ativos = fornecedores.filter((f) => f.status === "ativo").length;
    const pendentes = fornecedores.filter((f) => f.status === "pendente").length;
    const valorTotal = fornecedores
      .filter((f) => f.status === "ativo")
      .reduce((acc, f) => acc + f.valorMedioCompra, 0);
    return { total, ativos, pendentes, valorTotal };
  }, [fornecedores]);

  const filtered = useMemo(() => {
    let result = [...fornecedores].sort((a, b) => a.empresa.localeCompare(b.empresa));
    if (filterStatus !== "todos") {
      result = result.filter((f) => f.status === filterStatus);
    }
    if (filterCategoria !== "todas") {
      result = result.filter((f) => f.categoria === filterCategoria);
    }
    return result;
  }, [fornecedores, filterStatus, filterCategoria]);

  const upsert = (fornecedor: Fornecedor) => {
    setFornecedores((prev) => {
      const exists = prev.some((f) => f.id === fornecedor.id);
      return exists
        ? prev.map((f) => (f.id === fornecedor.id ? fornecedor : f))
        : [...prev, fornecedor];
    });
  };

  const remove = (id: string) => {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleStatus = (fornecedor: Fornecedor, status: FornecedorStatus) => {
    setFornecedores((prev) => prev.map((f) => (f.id === fornecedor.id ? { ...f, status } : f)));
    toast.success(`Fornecedor marcado como ${STATUS_CONFIG[status].label.toLowerCase()}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Fornecedores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parceiros que mantêm sua confeitaria abastecida e funcionando.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Novo fornecedor
        </Button>
      </div>

      {/* Resumo */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ResumoCard
          icon={<Users className="h-5 w-5" />}
          label="Total cadastrados"
          value={String(resumo.total)}
          color="text-chocolate"
          bg="bg-chocolate/10"
          hint="todos os fornecedores"
        />
        <ResumoCard
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Ativos"
          value={String(resumo.ativos)}
          color="text-green-600"
          bg="bg-green-500/10"
          hint="parceiros em dia"
        />
        <ResumoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Pendentes"
          value={String(resumo.pendentes)}
          color="text-amber-600"
          bg="bg-amber-500/10"
          hint={resumo.pendentes > 0 ? "aguardando validação" : "nenhum pendente"}
        />
        <ResumoCard
          icon={<Cake className="h-5 w-5" />}
          label="Faturamento anual"
          value={formatCurrency(resumo.valorTotal)}
          color="text-purple-600"
          bg="bg-purple-500/10"
          hint="soma dos valores médios"
        />
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {(
            [
              { value: "todos", label: "Todos" },
              { value: "ativo", label: "Ativos" },
              { value: "pendente", label: "Pendentes" },
              { value: "inativo", label: "Inativos" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                filterStatus === opt.value
                  ? "bg-chocolate text-cream"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Select
          value={filterCategoria}
          onValueChange={(v) => setFilterCategoria(v as typeof filterCategoria)}
        >
          <SelectTrigger className="h-9 w-52 rounded-full text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {Object.entries(CATEGORIAS).map(([value, cat]) => (
              <SelectItem key={value} value={value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-sm font-bold text-foreground">
            Fornecedores ({filtered.length})
          </h3>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum fornecedor"
            description={
              filterStatus === "todos" && filterCategoria === "todas"
                ? "Cadastre seu primeiro fornecedor para acompanhar os parceiros da loja."
                : "Ajuste os filtros ou adicione um novo fornecedor."
            }
            action={
              <Button className="rounded-full" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Cadastrar fornecedor
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor Médio</TableHead>
                  <TableHead className="text-right">Último Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => {
                  const cat = CATEGORIAS[f.categoria];
                  const CatIcon = cat.icon;
                  const st = STATUS_CONFIG[f.status];
                  const StIcon = st.icon;
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              cat.className,
                            )}
                          >
                            <CatIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{f.empresa}</p>
                            <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                              <User className="mr-1 inline h-3 w-3" />
                              {f.nome}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            cat.className,
                          )}
                        >
                          {cat.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {f.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {f.telefone}
                            </span>
                          )}
                          {f.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" /> {f.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                            st.className,
                          )}
                        >
                          <StIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-chocolate-dark">
                        {f.valorMedioCompra > 0 ? formatCurrency(f.valorMedioCompra) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {f.dataPagamento ? (
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                              <CalendarDays className="h-3 w-3" />
                              {fmtDate(f.dataPagamento)}
                            </span>
                            {f.valorUltimoPagamento > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatCurrency(f.valorUltimoPagamento)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {f.status === "pendente" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ativar fornecedor"
                              title="Ativar"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => toggleStatus(f, "ativo")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {f.status === "ativo" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Desativar fornecedor"
                              title="Desativar"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => toggleStatus(f, "inativo")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {f.status === "inativo" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Reativar fornecedor"
                              title="Reativar"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => toggleStatus(f, "ativo")}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Lançar pagamento"
                            title="Lançar pagamento"
                            className="text-chocolate hover:text-chocolate-dark hover:bg-chocolate/10"
                            onClick={() => setPagando(f)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar fornecedor"
                            title="Editar"
                            onClick={() => setEditing(f)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir fornecedor"
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (window.confirm(`Excluir "${f.empresa}"?`)) {
                                remove(f.id);
                                toast.success("Fornecedor excluído");
                              }
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <FornecedorForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(data, id) => {
            const now = new Date().toISOString();
            upsert({
              id: id ?? crypto.randomUUID(),
              ...data,
              status: editing?.status ?? "pendente",
              createdAt: id ? (editing?.createdAt ?? now) : now,
            });
            toast.success(id ? "Fornecedor atualizado" : "Fornecedor cadastrado com sucesso");
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {pagando && (
        <PagamentoDialog
          fornecedor={pagando}
          onClose={() => setPagando(null)}
          onConfirm={(data) => {
            upsert({ ...pagando, ...data, status: "ativo" });
            toast.success("Pagamento registrado com sucesso");
            setPagando(null);
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* FORMULÁRIO DE PAGAMENTO AO FORNECEDOR                               */
/* ================================================================== */

function PagamentoDialog({
  fornecedor,
  onClose,
  onConfirm,
}: {
  fornecedor: Fornecedor;
  onClose: () => void;
  onConfirm: (data: { dataPagamento: string; valorUltimoPagamento: number }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [dataPagamento, setDataPagamento] = useState(today);
  const [valor, setValor] = useState(fornecedor.valorMedioCompra);
  const [saving, setSaving] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!dataPagamento) {
      toast.error("Informe a data do pagamento");
      return;
    }
    setSaving(true);
    try {
      onConfirm({ dataPagamento, valorUltimoPagamento: valor });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-chocolate" />
            Lançar pagamento
          </DialogTitle>
          <DialogDescription>
            Registre o pagamento para <span className="font-semibold">{fornecedor.empresa}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Data do pagamento *</Label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Valor pago (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              placeholder="0,00"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirmar pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* FORMULÁRIO                                                          */
/* ================================================================== */

type FornecedorFormValues = Omit<Fornecedor, "id" | "status" | "createdAt">;

function FornecedorForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Fornecedor | null;
  onClose: () => void;
  onSave: (data: FornecedorFormValues, id: string | null) => void;
}) {
  const [form, setForm] = useState<FornecedorFormValues>({
    nome: initial?.nome ?? "",
    empresa: initial?.empresa ?? "",
    categoria: initial?.categoria ?? "ingredientes",
    telefone: initial?.telefone ?? "",
    email: initial?.email ?? "",
    whatsapp: initial?.whatsapp ?? "",
    cnpj: initial?.cnpj ?? "",
    endereco: initial?.endereco ?? "",
    observacao: initial?.observacao ?? "",
    valorMedioCompra: initial?.valorMedioCompra ?? 0,
    dataPagamento: initial?.dataPagamento ?? null,
    valorUltimoPagamento: initial?.valorUltimoPagamento ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FornecedorFormValues>(key: K, value: FornecedorFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    if (!form.nome.trim()) {
      toast.error("Informe o nome do contato");
      return;
    }
    setSaving(true);
    try {
      onSave(form, initial?.id ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          <DialogDescription>
            Cadastre um parceiro de negócios da Passarelli Doces.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {/* Dados da empresa */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Dados da empresa
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da empresa *">
                <Input
                  value={form.empresa}
                  onChange={(e) => set("empresa", e.target.value)}
                  placeholder="Ex.: Distribuidora Doce"
                />
              </Field>
              <Field label="Categoria">
                <Select
                  value={form.categoria}
                  onValueChange={(v) => set("categoria", v as FornecedorCategoria)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIAS).map(([value, cat]) => (
                      <SelectItem key={value} value={value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="CNPJ">
                <Input
                  value={form.cnpj}
                  onChange={(e) => set("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
              <Field label="Valor médio de compra (R$)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorMedioCompra}
                  onChange={(e) => set("valorMedioCompra", Number(e.target.value))}
                  placeholder="0,00"
                />
              </Field>
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Contato principal
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do contato *">
                <Input
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Ex.: João da Silva"
                />
              </Field>
              <Field label="Telefone">
                <Input
                  value={form.telefone}
                  onChange={(e) => set("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </Field>
              <Field label="E-mail">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="5500000000000"
                />
              </Field>
            </div>
          </div>

          {/* Endereço e observações */}
          <Field label="Endereço">
            <Input
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
              placeholder="Rua, número - Bairro, Cidade/UF"
            />
          </Field>
          <Field label="Observações">
            <Input
              value={form.observacao}
              onChange={(e) => set("observacao", e.target.value)}
              placeholder="Ex.: Prazo de entrega: 3 dias úteis"
            />
          </Field>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !form.empresa.trim() || !form.nome.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : initial ? (
                "Salvar alterações"
              ) : (
                "Cadastrar fornecedor"
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

/* ================================================================== */
/* COMPONENTES AUXILIARES                                              */
/* ================================================================== */

function ResumoCard({
  icon,
  label,
  value,
  color,
  bg,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg, color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-display text-xl font-extrabold text-foreground">{value}</p>
          <p className="truncate text-[10px] text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}
