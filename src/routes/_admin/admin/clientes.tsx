"use client";

import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit, MapPin, Phone, Plus, Search, Trash2, User, X, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { adminSaveCustomer, adminDeleteCustomer } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/clientes")({
  component: AdminCustomersPage,
});

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

type CustomerFormData = {
  name: string;
  phone: string;
  email: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
};

const EMPTY_FORM: CustomerFormData = {
  name: "",
  phone: "",
  email: "",
  document: "",
  zipCode: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  notes: "",
};

function AdminCustomersPage() {
  const { customers, refresh } = useAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.document.includes(q) ||
        c.city.toLowerCase().includes(q),
    );
  }, [customers, searchQuery]);

  const setField = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openNew = () => {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      document: c.document,
      zipCode: c.zipCode,
      address: c.address,
      number: c.number,
      complement: c.complement,
      neighborhood: c.neighborhood,
      city: c.city,
      state: c.state,
      notes: c.notes,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const id = editingCustomer?.id ?? `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await adminSaveCustomer({
        id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        document: form.document.trim(),
        zipCode: form.zipCode.trim(),
        address: form.address.trim(),
        number: form.number.trim(),
        complement: form.complement.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        notes: form.notes.trim(),
      });
      if (!res.ok) {
        toast.error("Erro ao salvar cliente", { description: res.error });
        return;
      }
      toast.success(editingCustomer ? "Cliente atualizado!" : "Cliente cadastrado!");
      setShowDialog(false);
      setEditingCustomer(null);
      setForm(EMPTY_FORM);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await adminDeleteCustomer(id);
    if (!res.ok) {
      toast.error("Erro ao excluir cliente", { description: res.error });
      return;
    }
    toast.success("Cliente excluído!");
    setConfirmDelete(null);
    await refresh();
  };

  const formatDocument = (doc: string) => {
    const d = doc.replace(/\D/g, "");
    if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc;
  };

  const formatPhone = (phone: string) => {
    const p = phone.replace(/\D/g, "");
    if (p.length === 11) return p.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (p.length === 10) return p.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} cliente{customers.length !== 1 ? "s" : ""} cadastrado
            {customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={openNew}
          className="rounded-full bg-chocolate text-white hover:bg-chocolate/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone, e-mail, CPF/CNPJ ou cidade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabela */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={User}
          title={searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={
            searchQuery
              ? "Tente outros termos de busca."
              : "Cadastre o primeiro cliente para começar."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-bold text-foreground">Cliente</TableHead>
                <TableHead className="hidden font-bold text-foreground md:table-cell">
                  Telefone
                </TableHead>
                <TableHead className="hidden font-bold text-foreground lg:table-cell">
                  E-mail
                </TableHead>
                <TableHead className="hidden font-bold text-foreground lg:table-cell">
                  CPF/CNPJ
                </TableHead>
                <TableHead className="hidden font-bold text-foreground xl:table-cell">
                  Cidade/UF
                </TableHead>
                <TableHead className="hidden font-bold text-foreground xl:table-cell">
                  Cadastrado
                </TableHead>
                <TableHead className="text-right font-bold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chocolate/10 text-sm font-bold text-chocolate">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {formatPhone(c.phone)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatPhone(c.phone) || "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {c.email || "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {c.document ? formatDocument(c.document) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                    {c.city && c.state ? `${c.city}/${c.state}` : c.city || c.state || "—"}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                    {formatDateTime(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Cadastro/Edição */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors",
          showDialog ? "visible bg-black/50" : "invisible",
        )}
        onClick={() => setShowDialog(false)}
      >
        <div
          className={cn(
            "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl transition-transform",
            showDialog ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chocolate/10">
                <User className="h-5 w-5 text-chocolate" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editingCustomer
                    ? "Atualize os dados do cliente."
                    : "Preencha os dados para cadastrar."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDialog(false)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Dados pessoais */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
                <User className="h-3.5 w-3.5" />
                Dados Pessoais
              </h3>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Nome completo"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      CPF/CNPJ
                    </label>
                    <input
                      type="text"
                      value={form.document}
                      onChange={(e) => setField("document", e.target.value)}
                      placeholder="000.000.000-00"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
                <MapPin className="h-3.5 w-3.5" />
                Endereço
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={form.zipCode}
                      onChange={(e) => setField("zipCode", e.target.value)}
                      placeholder="00000-000"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Rua
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="Rua, Avenida..."
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Número
                    </label>
                    <input
                      type="text"
                      value={form.number}
                      onChange={(e) => setField("number", e.target.value)}
                      placeholder="Nº"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={form.complement}
                      onChange={(e) => setField("complement", e.target.value)}
                      placeholder="Apto, Bloco..."
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={form.neighborhood}
                      onChange={(e) => setField("neighborhood", e.target.value)}
                      placeholder="Bairro"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Cidade"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      UF
                    </label>
                    <select
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    >
                      <option value="">UF</option>
                      {UF_OPTIONS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
                <FileText className="h-3.5 w-3.5" />
                Observações
              </h3>
              <textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Notas sobre o cliente, preferências, restrições..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setShowDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-full bg-chocolate text-white hover:bg-chocolate/90"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? "Salvando..." : editingCustomer ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Confirmar Exclusão */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors",
          confirmDelete ? "visible bg-black/50" : "invisible",
        )}
        onClick={() => setConfirmDelete(null)}
      >
        <div
          className={cn(
            "w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl transition-transform",
            confirmDelete ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="mt-4 text-center font-display text-lg font-bold text-foreground">
            Excluir cliente?
          </h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Essa ação não pode ser desfeita. O cliente será removido permanentemente.
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => setConfirmDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-full bg-destructive text-white hover:bg-destructive/90"
              onClick={() => confirmDelete && void handleDelete(confirmDelete)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
