"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ChefHat,
  CheckCircle2,
  CalendarDays,
  CreditCard,
  Download,
  Droplets,
  Home,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Store,
  Trash2,
  Wallet,
  Wifi,
  XCircle,
  Zap,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_admin/admin/contas-a-pagar")({
  component: AdminContasAPagarPage,
});

const STORAGE_KEY = "passarelli_contas_a_pagar";

type ContaStatus = "pendente" | "paga";
type ContaCategoria =
  | "fornecedores"
  | "embalagens"
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "impostos"
  | "folha"
  | "outros";

type ContaPagar = {
  id: string;
  descricao: string;
  fornecedor: string;
  fornecedorId: string | null;
  categoria: ContaCategoria;
  valor: number;
  dataEmissao: string;
  vencimento: string;
  status: ContaStatus;
  dataPagamento: string | null;
  observacao: string;
  recorrente: boolean;
  createdAt: string;
};

const CATEGORIAS: Record<
  ContaCategoria,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  fornecedores: { label: "Fornecedores", className: "bg-amber-100 text-amber-700", icon: Store },
  embalagens: { label: "Embalagens", className: "bg-sky-100 text-sky-700", icon: Package },
  aluguel: { label: "Aluguel", className: "bg-purple-100 text-purple-700", icon: Home },
  energia: { label: "Energia", className: "bg-yellow-100 text-yellow-700", icon: Zap },
  agua: { label: "Água", className: "bg-blue-100 text-blue-700", icon: Droplets },
  internet: { label: "Internet", className: "bg-cyan-100 text-cyan-700", icon: Wifi },
  impostos: { label: "Impostos", className: "bg-red-100 text-red-700", icon: Receipt },
  folha: { label: "Equipe", className: "bg-pink-100 text-pink-700", icon: ChefHat },
  outros: { label: "Outros", className: "bg-gray-100 text-gray-700", icon: MoreHorizontal },
};

function isOverdue(conta: ContaPagar, today: string): boolean {
  return conta.status === "pendente" && conta.vencimento < today;
}

function daysLate(vencimento: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${vencimento}T00:00:00`);
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function readStorage(): ContaPagar[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ContaPagar[];
  } catch {
    return [];
  }
}

const FORNECEDORES_STORAGE_KEY = "passarelli_fornecedores";

type FornecedorRef = {
  id: string;
  empresa: string;
  nome: string;
  status: string;
};

function readFornecedores(): FornecedorRef[] {
  try {
    return JSON.parse(localStorage.getItem(FORNECEDORES_STORAGE_KEY) ?? "[]") as FornecedorRef[];
  } catch {
    return [];
  }
}

function fornecedorCodigo(id: string | null | undefined): string {
  if (!id) return "—";
  return `FORN-${id.slice(0, 4).toUpperCase()}`;
}

function AdminContasAPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorRef[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"todas" | ContaStatus | "vencidas">("todas");
  const [filterCategoria, setFilterCategoria] = useState<"todas" | ContaCategoria>("todas");
  const [filterFornecedor, setFilterFornecedor] = useState<"todos" | string>("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ContaPagar | null>(null);
  const [pagando, setPagando] = useState<ContaPagar | null>(null);
  const [tab, setTab] = useState<"contas" | "relatorios">("contas");

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contas));
    }
  }, [contas, loaded]);

  useEffect(() => {
    setContas(readStorage());
    setFornecedores(readFornecedores());
    setLoaded(true);
  }, []);

  const today = todayISO();

  const resumo = useMemo(() => {
    const emAberto = contas
      .filter((c) => c.status === "pendente")
      .reduce((acc, c) => acc + c.valor, 0);
    const pagas = contas.filter((c) => c.status === "paga").reduce((acc, c) => acc + c.valor, 0);
    const vencidas = contas.filter((c) => isOverdue(c, today)).reduce((acc, c) => acc + c.valor, 0);

    const inicioMes = today.slice(0, 8) + "01";
    const fimMes = new Date().toISOString().slice(0, 8) + "31";
    const proximasDoMes = contas
      .filter(
        (c) =>
          c.status === "pendente" &&
          c.vencimento >= inicioMes &&
          c.vencimento <= fimMes &&
          !isOverdue(c, today),
      )
      .reduce((acc, c) => acc + c.valor, 0);

    return { emAberto, pagas, vencidas, proximasDoMes };
  }, [contas, today]);

  const hasDateFilter = startDate !== "" || endDate !== "";

  const filtered = useMemo(() => {
    let result = [...contas].sort(
      (a, b) => a.vencimento.localeCompare(b.vencimento) || a.createdAt.localeCompare(b.createdAt),
    );
    if (filterStatus === "vencidas") {
      result = result.filter((c) => isOverdue(c, today));
    } else if (filterStatus !== "todas") {
      result = result.filter((c) => c.status === filterStatus);
    }
    if (filterCategoria !== "todas") {
      result = result.filter((c) => c.categoria === filterCategoria);
    }
    if (filterFornecedor !== "todos") {
      result = result.filter((c) => c.fornecedorId === filterFornecedor);
    }
    if (hasDateFilter) {
      result = result.filter((c) => {
        const v = c.vencimento;
        if (startDate && v < startDate) return false;
        if (endDate && v > endDate) return false;
        return true;
      });
    }
    return result;
  }, [
    contas,
    filterStatus,
    filterCategoria,
    filterFornecedor,
    today,
    hasDateFilter,
    startDate,
    endDate,
  ]);

  const upsert = (conta: ContaPagar) => {
    setContas((prev) => {
      const exists = prev.some((c) => c.id === conta.id);
      const next = exists ? prev.map((c) => (c.id === conta.id ? conta : c)) : [...prev, conta];
      return next;
    });
  };

  const fornecedorMap = useMemo(() => {
    const map = new Map<string, FornecedorRef>();
    for (const f of fornecedores) map.set(f.id, f);
    return map;
  }, [fornecedores]);

  const remove = (conta: ContaPagar) => {
    setContas((prev) => prev.filter((c) => c.id !== conta.id));
  };

  const setStatus = (conta: ContaPagar, status: ContaStatus) => {
    setContas((prev) =>
      prev.map((c) =>
        c.id === conta.id ? { ...c, status, dataPagamento: status === "paga" ? today : null } : c,
      ),
    );
    toast.success(status === "paga" ? "Conta marcada como paga" : "Pagamento desfeito");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Contas a Pagar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle seus gastos: fornecedores, contas fixas e despesas da confeitaria.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-border bg-card p-1">
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                tab === "contas"
                  ? "bg-chocolate text-cream"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTab("contas")}
            >
              Contas
            </button>
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                tab === "relatorios"
                  ? "bg-chocolate text-cream"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTab("relatorios")}
            >
              <BarChart3 className="mr-1 inline h-3.5 w-3.5" />
              Relatórios
            </button>
          </div>
          <Button className="rounded-full" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nova conta
          </Button>
        </div>
      </div>

      {tab === "contas" ? (
        <div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ResumoCard
              icon={<Wallet className="h-5 w-5" />}
              label="Em aberto"
              value={formatCurrency(resumo.emAberto)}
              color="text-chocolate"
              bg="bg-chocolate/10"
              hint="contas ainda pendentes"
            />
            <ResumoCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Vencidas"
              value={formatCurrency(resumo.vencidas)}
              color="text-red-600"
              bg="bg-red-500/10"
              hint={resumo.vencidas > 0 ? "resolver com urgência" : "tudo em dia"}
            />
            <ResumoCard
              icon={<CalendarClock className="h-5 w-5" />}
              label="No mês à frente"
              value={formatCurrency(resumo.proximasDoMes)}
              color="text-amber-600"
              bg="bg-amber-500/10"
              hint="próximas parcelas do mês"
            />
            <ResumoCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Pagas este mês"
              value={formatCurrency(resumo.pagas)}
              color="text-green-600"
              bg="bg-green-500/10"
              hint="total já quitado no mês"
            />
          </div>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            onClear={() => {
              setStartDate("");
              setEndDate("");
            }}
            hasFilter={hasDateFilter}
          />

          {/* Filtros */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-full border border-border bg-card p-1">
              {(
                [
                  { value: "todas", label: "Todas" },
                  { value: "pendente", label: "Pendentes" },
                  { value: "vencidas", label: "Vencidas" },
                  { value: "paga", label: "Pagas" },
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
            <Select
              value={filterFornecedor}
              onValueChange={(v) => setFilterFornecedor(v as typeof filterFornecedor)}
            >
              <SelectTrigger className="h-9 w-56 rounded-full text-xs">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os fornecedores</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {fornecedorCodigo(f.id)} · {f.empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-display text-sm font-bold text-foreground">
                Contas levantadas ({filtered.length})
              </h3>
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Nenhuma conta aqui"
                description={
                  filterStatus === "todas" && filterCategoria === "todas"
                    ? "Adicione suas primeiras contas a pagar para começar o controle financeiro."
                    : "Ajuste os filtros ou adicione uma nova conta."
                }
                action={
                  <Button className="rounded-full" onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" /> Nova conta
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conta</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((conta) => {
                      const overdue = isOverdue(conta, today);
                      const cat = CATEGORIAS[conta.categoria];
                      const Icon = cat.icon;
                      const ref = conta.fornecedorId
                        ? fornecedorMap.get(conta.fornecedorId)
                        : undefined;
                      return (
                        <TableRow
                          key={conta.id}
                          className={cn(overdue && "bg-red-50/60 dark:bg-red-950/20")}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                  cat.className,
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="font-medium text-foreground">{conta.descricao}</p>
                                <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                                  {ref
                                    ? `${fornecedorCodigo(ref.id)} · ${ref.empresa}`
                                    : conta.fornecedor}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {conta.dataEmissao ? fmtDate(conta.dataEmissao) : "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {fmtDate(conta.vencimento)}
                            {overdue && (
                              <p className="text-[10px] font-semibold text-red-600">
                                {daysLate(conta.vencimento) === 1
                                  ? "1 dia de atraso"
                                  : `${daysLate(conta.vencimento)} dias de atraso`}
                              </p>
                            )}
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
                          <TableCell>
                            <StatusBadge conta={conta} />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-chocolate-dark">
                            {formatCurrency(conta.valor)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {conta.status === "pendente" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Marcar como paga"
                                  title="Marcar como paga"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => setPagando(conta)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              {conta.status === "paga" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Desfazer pagamento"
                                  title="Desfazer pagamento"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={() => setStatus(conta, "pendente")}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Editar conta"
                                title="Editar"
                                onClick={() => setEditing(conta)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Excluir conta"
                                title="Excluir"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (window.confirm(`Excluir "${conta.descricao}"?`)) {
                                    remove(conta);
                                    toast.success("Conta excluída");
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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
        </div>
      ) : (
        <RelatoriosTab contas={contas} fornecedores={fornecedores} />
      )}

      {(creating || editing) && (
        <ContaForm
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
              dataPagamento: editing?.status === "paga" ? data.dataPagamento : null,
              createdAt: id ? (editing?.createdAt ?? now) : now,
            });
            toast.success(id ? "Conta atualizada" : "Conta cadastrada");
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {pagando && (
        <PagamentoDialog
          conta={pagando}
          onClose={() => setPagando(null)}
          onConfirm={(dataPagamento) => {
            upsert({
              ...pagando,
              status: "paga",
              dataPagamento,
            });
            toast.success("Pagamento registrado com sucesso");
            setPagando(null);
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* FORMULÁRIO                                                          */
/* ================================================================== */

type ContaFormValues = Omit<ContaPagar, "id" | "status" | "createdAt">;

function ContaForm({
  initial,
  onClose,
  onSave,
}: {
  initial: ContaPagar | null;
  onClose: () => void;
  onSave: (data: ContaFormValues, id: string | null) => void;
}) {
  const [form, setForm] = useState<ContaFormValues>({
    descricao: initial?.descricao ?? "",
    fornecedor: initial?.fornecedor ?? "",
    fornecedorId: initial?.fornecedorId ?? null,
    categoria: initial?.categoria ?? "fornecedores",
    valor: initial?.valor ?? 0,
    dataEmissao: initial?.dataEmissao ?? todayISO(),
    vencimento: initial?.vencimento ?? todayISO(),
    dataPagamento: initial?.dataPagamento ?? null,
    observacao: initial?.observacao ?? "",
    recorrente: initial?.recorrente ?? false,
  });
  const [fornecedores, setFornecedores] = useState<FornecedorRef[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFornecedores(readFornecedores());
  }, []);

  const set = <K extends keyof ContaFormValues>(key: K, value: ContaFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSelectFornecedor = (id: string) => {
    const selected = fornecedores.find((f) => f.id === id);
    setForm((f) => ({
      ...f,
      fornecedorId: selected?.id ?? null,
      fornecedor: selected
        ? `${selected.empresa}${selected.nome ? ` - ${selected.nome}` : ""}`
        : "",
    }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.descricao.trim()) return;
    if (form.valor <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }
    if (!form.dataEmissao) {
      toast.error("Informe a data de emissão");
      return;
    }
    if (!form.vencimento) {
      toast.error("Informe a data de vencimento");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar conta a pagar" : "Nova conta a pagar"}</DialogTitle>
          <DialogDescription>
            Registre despesas da confeitaria para não perder nenhum vencimento no caixa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 grid gap-1.5">
              <Field label="Descrição *">
                <Input
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder="Ex.: Caixa de cupcake, farinha especial"
                />
              </Field>
            </div>
            <div className="sm:col-span-2 grid gap-1.5">
              <Field label="Fornecedor / beneficiário">
                {fornecedores.length > 0 ? (
                  <Select
                    value={form.fornecedorId ?? ""}
                    onValueChange={(v) => handleSelectFornecedor(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Selecione um fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum (digitar manual)</SelectItem>
                      {fornecedores
                        .filter((f) => f.status === "ativo" || f.id === form.fornecedorId)
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {fornecedorCodigo(f.id)} · {f.empresa}
                            {f.nome ? ` - ${f.nome}` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.fornecedor}
                    onChange={(e) => {
                      set("fornecedorId", null);
                      set("fornecedor", e.target.value);
                    }}
                    placeholder="Nenhum fornecedor cadastrado — digite o nome"
                  />
                )}
              </Field>
            </div>
            <div className="grid gap-1.5">
              <Field label="Categoria">
                <Select
                  value={form.categoria}
                  onValueChange={(v) => set("categoria", v as ContaCategoria)}
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
            </div>
            <div className="grid gap-1.5">
              <Field label="Valor (R$) *">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => set("valor", Number(e.target.value))}
                  placeholder="0,00"
                />
              </Field>
            </div>
            <div className="grid gap-1.5">
              <Field label="Data de emissão *">
                <Input
                  type="date"
                  value={form.dataEmissao}
                  onChange={(e) => set("dataEmissao", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-1.5">
              <Field label="Vencimento *">
                <Input
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => set("vencimento", e.target.value)}
                />
              </Field>
            </div>
            {initial?.status === "paga" && (
              <div className="grid gap-1.5">
                <Field label="Data de pagamento *">
                  <Input
                    type="date"
                    value={form.dataPagamento ?? todayISO()}
                    onChange={(e) => set("dataPagamento", e.target.value)}
                  />
                </Field>
              </div>
            )}
            <div className="sm:col-span-2 grid gap-1.5">
              <Field label="Observação">
                <Input
                  value={form.observacao}
                  onChange={(e) => set("observacao", e.target.value)}
                  placeholder="Opcional"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Conta recorrente</p>
              <p className="text-xs text-muted-foreground">
                Se repete todo mês (aluguel, energia...)
              </p>
            </div>
            <Switch checked={form.recorrente} onCheckedChange={(v) => set("recorrente", v)} />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !form.descricao.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : initial ? (
                "Salvar alterações"
              ) : (
                "Adicionar conta"
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

/* ================================================================== */
/* FILTRO DE PERÍODO                                                   */
/* ================================================================== */

function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
  hasFilter,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onClear: () => void;
  hasFilter: boolean;
}) {
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    onStartChange(start.toISOString().slice(0, 10));
    onEndChange(end.toISOString().slice(0, 10));
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-r from-chocolate to-chocolate-dark px-5 py-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
          <CalendarDays className="h-4 w-4" />
          Filtrar por vencimento
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Data inicial
          </label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartChange(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>
        <div className="pb-3 text-muted-foreground">
          <span className="text-lg">–</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Data final
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndChange(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="flex items-center gap-1.5 pb-1">
          <span className="hidden text-xs text-muted-foreground sm:inline">Atalhos:</span>
          <button
            onClick={() => applyPreset(1)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            Hoje
          </button>
          <button
            onClick={() => applyPreset(7)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            7 dias
          </button>
          <button
            onClick={() => applyPreset(15)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            15 dias
          </button>
          <button
            onClick={() => applyPreset(30)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            30 dias
          </button>
        </div>

        {hasFilter && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-gold hover:text-chocolate-dark"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* RELATÓRIOS                                                          */
/* ================================================================== */

const CATEGORY_COLORS: Record<string, string> = {
  fornecedores: "#f59e0b",
  embalagens: "#0ea5e9",
  aluguel: "#a855f7",
  energia: "#eab308",
  agua: "#3b82f6",
  internet: "#06b6d4",
  impostos: "#ef4444",
  folha: "#ec4899",
  outros: "#6b7280",
};

function monthKey(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function RelatoriosTab({
  contas,
  fornecedores,
}: {
  contas: ContaPagar[];
  fornecedores: FornecedorRef[];
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const today = todayISO();
  const hasDateFilter = startDate !== "" || endDate !== "";

  const kpis = useMemo(() => {
    const inPeriod = (date: string | null): boolean => {
      if (!date) return false;
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    };
    const pagasNoPeriodo = contas
      .filter((c) => c.status === "paga" && inPeriod(c.dataPagamento))
      .reduce((acc, c) => acc + c.valor, 0);
    const emAberto = contas
      .filter((c) => c.status === "pendente")
      .reduce((acc, c) => acc + c.valor, 0);
    const vencidas = contas.filter((c) => isOverdue(c, today)).reduce((acc, c) => acc + c.valor, 0);
    const countPagas = contas.filter(
      (c) => c.status === "paga" && inPeriod(c.dataPagamento),
    ).length;
    return { pagasNoPeriodo, emAberto, vencidas, countPagas };
  }, [contas, startDate, endDate, today]);

  const monthlyPaid = useMemo(() => {
    const map = new Map<string, { label: string; valor: number; qtd: number }>();
    for (const c of contas) {
      if (c.status !== "paga" || !c.dataPagamento) continue;
      const label = monthKey(c.dataPagamento);
      const existing = map.get(label) ?? { label, valor: 0, qtd: 0 };
      existing.valor += c.valor;
      existing.qtd += 1;
      map.set(label, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6);
  }, [contas]);

  const monthlyDue = useMemo(() => {
    const map = new Map<string, { label: string; valor: number; qtd: number }>();
    for (const c of contas) {
      if (c.status !== "pendente") continue;
      const label = monthKey(c.vencimento);
      const existing = map.get(label) ?? { label, valor: 0, qtd: 0 };
      existing.valor += c.valor;
      existing.qtd += 1;
      map.set(label, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-8);
  }, [contas]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { label: string; valor: number; qtd: number }>();
    for (const c of contas) {
      const cat = CATEGORIAS[c.categoria];
      const existing = map.get(c.categoria) ?? { label: cat.label, valor: 0, qtd: 0 };
      existing.valor += c.valor;
      existing.qtd += 1;
      map.set(c.categoria, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  }, [contas]);

  const byFornecedor = useMemo(() => {
    const map = new Map<string, { label: string; valor: number; qtd: number }>();
    for (const c of contas) {
      const ref = c.fornecedorId ? fornecedores.find((f) => f.id === c.fornecedorId) : undefined;
      const nome = ref
        ? `${fornecedorCodigo(ref.id)} · ${ref.empresa}`
        : c.fornecedor || "Sem fornecedor";
      const existing = map.get(nome) ?? { label: nome, valor: 0, qtd: 0 };
      existing.valor += c.valor;
      existing.qtd += 1;
      map.set(nome, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [contas, fornecedores]);

  const exportCSV = () => {
    const rows = contas.map((c) => {
      const ref = c.fornecedorId ? fornecedores.find((f) => f.id === c.fornecedorId) : undefined;
      return [
        fornecedorCodigo(ref?.id) !== "—" ? fornecedorCodigo(ref?.id) : "",
        c.descricao,
        ref?.empresa ?? c.fornecedor,
        CATEGORIAS[c.categoria].label,
        c.dataEmissao ? fmtDate(c.dataEmissao) : "",
        fmtDate(c.vencimento),
        c.dataPagamento ? fmtDate(c.dataPagamento) : "",
        String(c.valor).replace(".", ","),
        c.status === "paga" ? "paga" : isOverdue(c, today) ? "vencida" : "pendente",
      ].join(";");
    });
    const header =
      "codigo;descricao;fornecedor;categoria;emissao;vencimento;pagamento;valor;status\n";
    const csv = header + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-contas-a-pagar-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado em CSV");
  };

  const imprimirRelatorio = () => {
    const periodo = hasDateFilter
      ? `${fmtDate(startDate)} a ${fmtDate(endDate)}`
      : "Todas as contas";
    const contasOrdenadas = [...contas].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    const rowsHtml = contasOrdenadas
      .map((c) => {
        const ref = c.fornecedorId ? fornecedores.find((f) => f.id === c.fornecedorId) : undefined;
        const statusLabel =
          c.status === "paga" ? "Paga" : isOverdue(c, today) ? "Vencida" : "Pendente";
        const statusClass =
          c.status === "paga"
            ? "color:#16a34a;font-weight:700"
            : isOverdue(c, today)
              ? "color:#dc2626;font-weight:700"
              : "color:#d97706;font-weight:700";
        return `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px">${fornecedorCodigo(ref?.id) !== "—" ? fornecedorCodigo(ref?.id) : "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:600">${c.descricao}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px">${ref ? ref.empresa : c.fornecedor || "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${CATEGORIAS[c.categoria].label}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${c.dataEmissao ? fmtDate(c.dataEmissao) : "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${fmtDate(c.vencimento)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${c.dataPagamento ? fmtDate(c.dataPagamento) : "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right;font-weight:700">${formatCurrency(c.valor)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;${statusClass}">${statusLabel}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Contas a Pagar – Passarelli Doces</title>
  <style>
    @media print {
      @page { size: landscape; margin: 12mm 10mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 16px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2a1510; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 18px; color: #2a1510; }
    .header h2 { font-size: 13px; color: #2a1510; font-weight: 600; }
    .header .meta { font-size: 11px; color: #666; text-align: right; line-height: 1.5; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
    .kpi .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi .value { font-size: 16px; font-weight: 800; margin-top: 2px; }
    .kpi .hint { font-size: 10px; color: #888; margin-top: 1px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #2a1510; color: #f5e6c8; padding: 7px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
    th:nth-child(1) { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    td { text-align: left; }
    tr:nth-child(even) { background: #fafaf8; }
    .footer { margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; font-size: 11px; color: #888; }
    .footer .total { font-weight: 800; color: #2a1510; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Passarelli Doces</h1>
      <h2>Relatório de Contas a Pagar</h2>
    </div>
    <div class="meta">
      Período: <strong>${periodo}</strong><br/>
      Emitido em: <strong>${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="label">Pagas no período</div>
      <div class="value" style="color:#16a34a">${formatCurrency(kpis.pagasNoPeriodo)}</div>
      <div class="hint">${kpis.countPagas} conta${kpis.countPagas !== 1 ? "s" : ""} quitada${kpis.countPagas !== 1 ? "s" : ""}</div>
    </div>
    <div class="kpi">
      <div class="label">Em aberto</div>
      <div class="value" style="color:#2a1510">${formatCurrency(kpis.emAberto)}</div>
      <div class="hint">pendentes</div>
    </div>
    <div class="kpi">
      <div class="label">Vencidas</div>
      <div class="value" style="color:#dc2626">${formatCurrency(kpis.vencidas)}</div>
      <div class="hint">${kpis.vencidas > 0 ? "atenção ao caixa" : "tudo em dia"}</div>
    </div>
    <div class="kpi">
      <div class="label">Total de contas</div>
      <div class="value" style="color:#7c3aed">${formatCurrency(contas.reduce((a, c) => a + c.valor, 0))}</div>
      <div class="hint">${contas.length} contas registradas</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th>Fornecedor</th>
        <th style="text-align:center">Categoria</th>
        <th style="text-align:center">Emissão</th>
        <th style="text-align:center">Vencimento</th>
        <th style="text-align:center">Pagamento</th>
        <th style="text-align:right">Valor</th>
        <th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>${contas.length} registro${contas.length !== 1 ? "s" : ""}</span>
    <span class="total">Total: ${formatCurrency(contas.reduce((a, c) => a + c.valor, 0))}</span>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    } else {
      toast.error("Bloqueador de pop-ups impediu a impressão. Libere este site.");
    }
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onClear={() => {
            setStartDate("");
            setEndDate("");
          }}
          hasFilter={hasDateFilter}
        />
        <div className="flex items-center gap-2">
          <Button className="rounded-full" variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button className="rounded-full" onClick={imprimirRelatorio}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {hasDateFilter && (
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-soft/40 px-4 py-2.5 text-xs font-medium text-chocolate-dark">
          <CalendarDays className="h-4 w-4 text-gold-dark" />
          Período do relatório:{" "}
          <span className="font-bold">
            {startDate || "início"} até {endDate || "hoje"}
          </span>{" "}
          — as datas consideram emissão, vencimento e pagamento.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ResumoCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Pagas no período"
          value={formatCurrency(kpis.pagasNoPeriodo)}
          color="text-green-600"
          bg="bg-green-500/10"
          hint={`${kpis.countPagas} conta${kpis.countPagas !== 1 ? "s" : ""} quitada${kpis.countPagas !== 1 ? "s" : ""}`}
        />
        <ResumoCard
          icon={<Wallet className="h-5 w-5" />}
          label="Em aberto"
          value={formatCurrency(kpis.emAberto)}
          color="text-chocolate"
          bg="bg-chocolate/10"
          hint="contas ainda pendentes"
        />
        <ResumoCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Vencidas"
          value={formatCurrency(kpis.vencidas)}
          color="text-red-600"
          bg="bg-red-500/10"
          hint={kpis.vencidas > 0 ? "atenção ao caixa" : "tudo em dia"}
        />
        <ResumoCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Total contas"
          value={formatCurrency(contas.reduce((a, c) => a + c.valor, 0))}
          color="text-purple-600"
          bg="bg-purple-500/10"
          hint={`${contas.length} contas registradas`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-bold text-foreground">Pagamentos por mês</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Valor quitado (últimos 6 meses)</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPaid}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-foreground">{d.label}</p>
                        <p className="text-green-600">{formatCurrency(d.valor)}</p>
                        <p className="text-muted-foreground">{d.qtd} pagamentos</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="valor" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-bold text-foreground">A vencer por mês</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Contas pendentes agrupadas pelo vencimento
          </p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-foreground">{d.label}</p>
                        <p className="text-amber-600">{formatCurrency(d.valor)}</p>
                        <p className="text-muted-foreground">{d.qtd} contas</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="valor" fill="#c9a84c" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Por categoria */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-bold text-foreground">
            Distribuição por categoria
          </h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  dataKey="valor"
                  stroke="none"
                >
                  {byCategory.map((entry) => (
                    <Cell key={entry.label} fill={CATEGORY_COLORS[entry.label] ?? "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-foreground">{d.label}</p>
                        <p className="text-chocolate">{formatCurrency(d.valor)}</p>
                        <p className="text-muted-foreground">{d.qtd} contas</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {byCategory.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[d.label] ?? "#9ca3af" }}
                />
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium text-foreground">{formatCurrency(d.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top fornecedores */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-bold text-foreground">Top fornecedores</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Maiores valores registrados</p>
          <div className="mt-4 space-y-3">
            {byFornecedor.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum dado de fornecedor ainda.
              </p>
            ) : (
              byFornecedor.map((d) => {
                const total = byFornecedor.reduce((a, b) => a + b.valor, 0);
                const pct = total > 0 ? (d.valor / total) * 100 : 0;
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="max-w-[220px] truncate font-medium text-foreground">
                        {d.label}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(d.valor)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-chocolate to-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CONFIRMAÇÃO DE PAGAMENTO                                             */
/* ================================================================== */

function PagamentoDialog({
  conta,
  onClose,
  onConfirm,
}: {
  conta: ContaPagar;
  onClose: () => void;
  onConfirm: (dataPagamento: string) => void;
}) {
  const today = todayISO();
  const [dataPagamento, setDataPagamento] = useState(today);
  const [saving, setSaving] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!dataPagamento) {
      toast.error("Informe a data do pagamento");
      return;
    }
    setSaving(true);
    try {
      onConfirm(dataPagamento);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Confirmar pagamento
          </DialogTitle>
          <DialogDescription>
            Registre a data em que <span className="font-semibold">{conta.descricao}</span> foi
            quitada.
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
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Valor:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(conta.valor)}</span>
            <br />
            Vencimento: <span className="font-medium">{fmtDate(conta.vencimento)}</span>
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
                  <CheckCircle2 className="h-4 w-4" /> Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ conta }: { conta: ContaPagar }) {
  if (conta.status === "paga") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Paga {conta.dataPagamento ? `em ${fmtDate(conta.dataPagamento)}` : ""}
      </span>
    );
  }
  if (isOverdue(conta, todayISO())) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">
        <XCircle className="h-3 w-3" />
        Vencida
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
      <CalendarClock className="h-3 w-3" />
      Pendente
    </span>
  );
}
