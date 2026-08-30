"use client";

import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, createFileRoute } from "@tanstack/react-router";
import {
  BadgePercent,
  Home,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  Target,
  Eye,
  CreditCard,
  RefreshCw,
  Shield,
  Edit,
  Tags,
} from "lucide-react";
import { AdminDataProvider, useAdminData } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS, DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type SiteSettings, type SocialLink, type ValueItem, type PageContent } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/configuracoes")({
  component: AdminConfiguracoesPage,
});

function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocial, setNewSocial] = useState<Partial<SocialLink> & { platform: string }>({ platform: "instagram", url: "", label: "" });
  const [values, setValues] = useState<ValueItem[]>([]);
  const [newValue, setNewValue] = useState<ValueItem>({ title: "", description: "" });
  const [pages, setPages] = useState<Record<string, PageContent>>(DEFAULT_SETTINGS.pages);
  const [editingPage, setEditingPage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("key, value")
        .in("key", ["identity", "contact", "social", "whatsapp", "pages"]);

      if (!error && data) {
        const map: Record<string, unknown> = {};
        data.forEach((row: Record<string, unknown>) => (map[row["key"] as string] = row["value"]));

        const identity = (map["identity"] as Record<string, unknown>) ?? {};
        const contact = (map["contact"] as Record<string, unknown>) ?? {};
        const whatsapp = (map["whatsapp"] as Record<string, unknown>) ?? {};
        const pagesData = (map["pages"] as Record<string, PageContent>) ?? {};

        setSettings({
          name: identity["name"] as string ?? DEFAULT_SETTINGS.name,
          tagline: identity["tagline"] as string ?? DEFAULT_SETTINGS.tagline,
          primaryColor: identity["primaryColor"] as string ?? "#2a1510",
          secondaryColor: identity["secondaryColor"] as string ?? "#c9a84c",
          history: identity["history"] as string ?? DEFAULT_SETTINGS.history,
          mission: identity["mission"] as string ?? DEFAULT_SETTINGS.mission,
          vision: identity["vision"] as string ?? DEFAULT_SETTINGS.vision,
          productsPageBanner: identity["productsPageBanner"] as string ?? DEFAULT_SETTINGS.productsPageBanner,
          productsPageBannerAlt: identity["productsPageBannerAlt"] as string ?? DEFAULT_SETTINGS.productsPageBannerAlt,
          email: contact["email"] as string ?? DEFAULT_SETTINGS.email,
          phone: contact["phone"] as string ?? DEFAULT_SETTINGS.phone,
          whatsapp: contact["whatsapp"] as string ?? DEFAULT_SETTINGS.whatsapp,
          address: contact["address"] as string ?? DEFAULT_SETTINGS.address,
          hours: contact["hours"] as string ?? DEFAULT_SETTINGS.hours,
          mapUrl: contact["mapUrl"] as string ?? "",
          cnpj: contact["cnpj"] as string ?? DEFAULT_SETTINGS.cnpj,
          whatsappNumber: whatsapp["number"] as string ?? DEFAULT_SETTINGS.whatsappNumber,
          whatsappMessage: whatsapp["defaultMessage"] as string ?? DEFAULT_SETTINGS.whatsappMessage,
        });
        setValues((identity["values"] as ValueItem[]) ?? DEFAULT_SETTINGS.values);
        setPages({
          quemSomos: pagesData["quemSomos"] ?? DEFAULT_SETTINGS.pages.quemSomos,
          nossaMissao: pagesData["nossaMissao"] ?? DEFAULT_SETTINGS.pages.nossaMissao,
          formasPagamento: pagesData["formasPagamento"] ?? DEFAULT_SETTINGS.pages.formasPagamento,
          trocasDevolucoes: pagesData["trocasDevolucoes"] ?? DEFAULT_SETTINGS.pages.trocasDevolucoes,
          politicaPrivacidade: pagesData["politicaPrivacidade"] ?? DEFAULT_SETTINGS.pages.politicaPrivacidade,
        });
        setSocialLinks((map["social"] as SocialLink[]) ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveSection = async (key: "identity" | "contact" | "social" | "whatsapp" | "pages", value: unknown) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    const { error } = await (supabase as any)
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    setSaving((prev) => ({ ...prev, [key]: false }));
    if (error) {
      toast.error(`Erro ao salvar ${key}`, { description: error.message });
    } else {
      toast.success(`${key} salvo com sucesso`);
    }
  };

  const handleIdentitySave = () => {
    saveSection("identity", {
      name: settings.name,
      tagline: settings.tagline,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      history: settings.history,
      mission: settings.mission,
      vision: settings.vision,
      values,
      productsPageBanner: settings.productsPageBanner,
      productsPageBannerAlt: settings.productsPageBannerAlt,
    });
  };

  const handleContactSave = () => {
    saveSection("contact", {
      email: settings.email,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      address: settings.address,
      hours: settings.hours,
      mapUrl: settings.mapUrl,
      cnpj: settings.cnpj,
    });
  };

  const handleWhatsAppSave = () => {
    saveSection("whatsapp", {
      number: settings.whatsappNumber,
      defaultMessage: settings.whatsappMessage,
    });
  };

  const handleSocialSave = () => {
    saveSection("social", socialLinks);
  };

  const handlePagesSave = () => {
    saveSection("pages", pages);
  };

  const addSocial = () => {
    if (!newSocial.url || !newSocial.label) return;
    setSocialLinks([...socialLinks, newSocial as SocialLink]);
    setNewSocial({ platform: "instagram", url: "", label: "" });
  };

  const removeSocial = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const addValue = () => {
    if (!newValue.title || !newValue.description) return;
    setValues([...values, newValue]);
    setNewValue({ title: "", description: "" });
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const startEditPage = (key: string) => {
    setEditingPage(key);
  };

  const savePage = (key: string) => {
    setEditingPage(null);
    toast.success("Página salva. Clique em 'Salvar páginas' para persistir no banco.");
  };

  const cancelEditPage = (key: string) => {
    setPages((prev) => ({ ...prev, [key]: DEFAULT_SETTINGS.pages[key as keyof typeof DEFAULT_SETTINGS.pages]! }));
    setEditingPage(null);
  };

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Configurações do Site
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie identidade, contato, redes sociais, WhatsApp e páginas institucionais.
        </p>
      </div>

      {/* IDENTIDADE */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <BadgePercent className="h-5 w-5 text-gold-dark" /> Identidade da Marca
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome do estabelecimento</label>
            <input
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
            <input
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cor principal</label>
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              className="h-11 rounded-xl border border-border p-1 cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cor secundária</label>
            <input
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
              className="h-11 rounded-xl border border-border p-1 cursor-pointer"
            />
          </div>
        </div>

        {/* História */}
        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">História da marca</label>
          <textarea
            value={settings.history}
            onChange={(e) => setSettings({ ...settings, history: e.target.value })}
            rows={4}
            className="mt-1.5 w-full h-32 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 resize-none"
            placeholder="Conte a história da sua marca..."
          />
        </div>

        {/* Missão */}
        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">Missão</label>
          <textarea
            value={settings.mission}
            onChange={(e) => setSettings({ ...settings, mission: e.target.value })}
            rows={3}
            className="mt-1.5 w-full h-24 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 resize-none"
            placeholder="Qual é a missão da empresa..."
          />
        </div>

        {/* Visão */}
        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">Visão</label>
          <textarea
            value={settings.vision}
            onChange={(e) => setSettings({ ...settings, vision: e.target.value })}
            rows={3}
            className="mt-1.5 w-full h-24 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 resize-none"
            placeholder="Qual é a visão de futuro..."
          />
        </div>

        {/* Banner da Página de Produtos */}
        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">Banner da página de produtos (URL da imagem)</label>
          <input
            value={settings.productsPageBanner}
            onChange={(e) => setSettings({ ...settings, productsPageBanner: e.target.value })}
            placeholder="https://exemplo.com/banner-produtos.jpg"
            className="mt-1.5 w-full h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Deixe vazio para não exibir banner. Imagem recomendada: 1200x400px
          </p>
        </div>

        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">Texto alternativo do banner (acessibilidade)</label>
          <input
            value={settings.productsPageBannerAlt}
            onChange={(e) => setSettings({ ...settings, productsPageBannerAlt: e.target.value })}
            placeholder="Nossos doces artesanais"
            className="mt-1.5 w-full h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {/* Valores */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Valores da marca</label>
            <div className="flex gap-2">
              <input
                value={newValue.title}
                onChange={(e) => setNewValue({ ...newValue, title: e.target.value })}
                placeholder="Título"
                className="h-10 w-40 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
              />
              <input
                value={newValue.description}
                onChange={(e) => setNewValue({ ...newValue, description: e.target.value })}
                placeholder="Descrição"
                className="h-10 w-60 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
              />
              <button onClick={addValue} className="h-10 px-4 rounded-xl bg-chocolate text-cream font-medium hover:bg-chocolate-dark">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {values.map((v, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                </div>
                <button onClick={() => removeValue(i)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            disabled={saving["identity"]}
            onClick={handleIdentitySave}
            className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark disabled:opacity-50"
          >
            {saving["identity"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar identidade
          </button>
        </div>
      </div>

      {/* CONTATO */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Settings className="h-5 w-5 text-gold-dark" /> Contato
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">E-mail</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Telefone (exibição)</label>
            <input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">WhatsApp (somente números)</label>
            <input
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="5511999999999"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">CNPJ</label>
            <input
              value={settings.cnpj}
              onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Endereço</label>
            <input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Av. das Nações, 1234 - São Paulo/SP"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Horário de funcionamento</label>
            <input
              value={settings.hours}
              onChange={(e) => setSettings({ ...settings, hours: e.target.value })}
              placeholder="Seg a Sáb: 08h às 19h"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">URL do mapa (embed)</label>
            <input
              value={settings.mapUrl}
              onChange={(e) => setSettings({ ...settings, mapUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?..."
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={saving["contact"]}
            onClick={handleContactSave}
            className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark disabled:opacity-50"
          >
            {saving["contact"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar contato
          </button>
        </div>
      </div>

      {/* REDES SOCIAIS */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <LinkIcon className="h-5 w-5 text-gold-dark" /> Redes Sociais
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <select
                    value={link.platform}
                    onChange={(e) => {
                      const updated = [...socialLinks] as SocialLink[];
                      updated[index] = { ...updated[index], platform: e.target.value } as SocialLink;
                      setSocialLinks(updated);
                    }}
                    className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...socialLinks] as SocialLink[];
                      updated[index] = { ...updated[index], url: e.target.value } as SocialLink;
                      setSocialLinks(updated);
                    }}
                    placeholder="https://..."
                    className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const updated = [...socialLinks] as SocialLink[];
                      updated[index] = { ...updated[index], label: e.target.value } as SocialLink;
                      setSocialLinks(updated);
                    }}
                    placeholder="Rótulo"
                    className="w-40 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
                  />
                </div>
              </div>
              <button
                onClick={() => removeSocial(index)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-3">
            <Plus className="h-5 w-5 text-muted-foreground" />
            <select
              value={newSocial.platform}
              onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
              className="h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            <input
              type="url"
              value={newSocial.url}
              onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
              placeholder="https://..."
              className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
            />
            <input
              type="text"
              value={newSocial.label}
              onChange={(e) => setNewSocial({ ...newSocial, label: e.target.value })}
              placeholder="Rótulo"
              className="w-40 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-gold"
            />
            <button onClick={addSocial} className="h-10 px-4 rounded-xl bg-chocolate text-cream font-medium hover:bg-chocolate-dark">
              Adicionar
            </button>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={saving["social"]}
            onClick={handleSocialSave}
            className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark disabled:opacity-50"
          >
            {saving["social"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar redes sociais
          </button>
        </div>
      </div>

      {/* WHATSAPP */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Settings className="h-5 w-5 text-gold-dark" /> WhatsApp
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Número (somente números)</label>
            <input
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              placeholder="5511999999999"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mensagem padrão</label>
            <input
              value={settings.whatsappMessage}
              onChange={(e) => setSettings({ ...settings, whatsappMessage: e.target.value })}
              placeholder="Olá! Gostaria de fazer um pedido 🍬"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={saving["whatsapp"]}
            onClick={handleWhatsAppSave}
            className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark disabled:opacity-50"
          >
            {saving["whatsapp"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar WhatsApp
          </button>
        </div>
      </div>

      {/* PÁGINAS INSTITUCIONAIS */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <BookOpen className="h-5 w-5 text-gold-dark" /> Páginas Institucionais
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite o conteúdo das páginas institucionais. Use HTML para formatação.
        </p>

{[
          { key: "quemSomos", label: "Quem Somos", icon: BookOpen },
          { key: "nossaMissao", label: "Nossa Missão", icon: Target },
          { key: "formasPagamento", label: "Formas de Pagamento", icon: CreditCard },
          { key: "trocasDevolucoes", label: "Trocas e Devoluções", icon: RefreshCw },
          { key: "politicaPrivacidade", label: "Política de Privacidade", icon: Shield },
        ].map(({ key, label, icon: Icon }) => {
          const page: PageContent = pages[key] ?? DEFAULT_SETTINGS.pages[key]!;
          const isEditing = editingPage === key;
          return (
            <div key={key} className="mt-4 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="h-5 w-5 text-gold-dark" />
                <h3 className="font-display text-lg font-bold text-foreground">{label}</h3>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Título</label>
                    <input
                      value={page.title}
                      onChange={(e) => setPages((prev) => ({ ...prev, [key]: { ...page, title: e.target.value } as PageContent }))}
                      className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
                    <input
                      value={page.subtitle}
                      onChange={(e) => setPages((prev) => ({ ...prev, [key]: { ...page, subtitle: e.target.value } as PageContent }))}
                      className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Conteúdo (HTML)</label>
                    <textarea
                      value={page.content}
                      onChange={(e) => setPages((prev) => ({ ...prev, [key]: { ...page, content: e.target.value } as PageContent }))}
                      rows={8}
                      className="h-48 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 resize-none font-mono text-xs"
                      placeholder="<p>Conteúdo da página...</p>"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => cancelEditPage(key)}
                      className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => savePage(key)}
                      className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark"
                    >
                      <Save className="h-4 w-4" /> Salvar alterações
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: page.content }} />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => startEditPage(key)}
                      className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark"
                    >
                      <Edit className="h-4 w-4" /> Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-6 flex justify-end">
          <button
            disabled={saving["pages"]}
            onClick={handlePagesSave}
            className="inline-flex items-center gap-2 rounded-full bg-chocolate px-6 py-2.5 text-sm font-semibold text-cream hover:bg-chocolate-dark disabled:opacity-50"
          >
            {saving["pages"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar todas as páginas
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const pathname = useLocation().href;
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const res = await supabase.auth.getSession();
        if (!mounted) return;
        const email = res.data.session?.user?.email;
        setUser(email && ADMINS.includes(email) ? { email } : null);
      } catch {
        setUser(null);
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = !!user;

  return (
    <AdminDataProvider>
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-chocolate-dark text-cream lg:flex">
          <RouterLink
            to="/admin"
            className="flex items-center gap-2.5 border-b border-cream/10 px-6 py-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream font-display text-xl font-black italic text-chocolate-dark">
              P
            </span>
            <div className="leading-none">
              <p className="font-display text-base font-black uppercase tracking-wide">
                Passarelli
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                Painel Admin
              </p>
            </div>
          </RouterLink>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <RouterLink
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold text-chocolate-dark shadow-sm"
                      : "text-cream/80 hover:bg-cream/10 hover:text-cream",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </RouterLink>
              );
            })}
          </nav>

          <div className="border-t border-cream/10 p-4">
            <a
              href={buildWhatsAppLink(DEFAULT_SETTINGS.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="mb-2 flex items-center gap-2 rounded-xl bg-[#25D366]/15 px-4 py-2.5 text-xs font-semibold text-[#6ee7a0] transition-colors hover:bg-[#25D366]/25"
            >
              Suporte Passarelli
            </a>
            <RouterLink
              to="/"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-cream/10"
            >
              <Home className="h-4 w-4" />
              Ver a loja
            </RouterLink>
            {isAdmin && (
              <button
                type="button"
                onClick={() => void supabase.auth.signOut()}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-cream/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            )}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <RouterLink to="/admin" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-chocolate font-display text-sm font-black italic text-gold">
                P
              </span>
              <span className="font-display text-sm font-black uppercase tracking-wide text-chocolate-dark">
                Painel Admin
              </span>
            </RouterLink>
            <RouterLink
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-chocolate-dark"
            >
              <Home className="h-4 w-4" /> Loja
            </RouterLink>
          </header>

          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2 lg:hidden">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <RouterLink
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                    active ? "bg-chocolate text-cream" : "border border-border text-muted-foreground",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </RouterLink>
              );
            })}
          </nav>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {!isAdmin ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-chocolate-dark/70">Faça login como administrador para acessar as configurações.</p>
              </div>
            ) : (
              <AdminConfiguracoesPage />
            )}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}

type AdminUser = { email: string };

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/banners", label: "Banners", icon: BadgePercent },
  { to: "/admin/pedidos", label: "Pedidos", icon: ReceiptText },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: true },
];