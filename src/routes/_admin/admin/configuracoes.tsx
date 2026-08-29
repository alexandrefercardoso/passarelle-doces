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
} from "lucide-react";
import { AdminDataProvider, useAdminData } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS, DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type SiteSettings, type SocialLink } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/configuracoes")({
  component: AdminConfiguracoesPage,
});

function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocial, setNewSocial] = useState<Partial<SocialLink> & { platform: string }>({ platform: "instagram", url: "", label: "" });

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("key, value")
        .in("key", ["identity", "contact", "social", "whatsapp"]);

      if (!error && data) {
        const map: Record<string, unknown> = {};
        data.forEach((row: Record<string, unknown>) => (map[row["key"] as string] = row["value"]));

        const identity = (map["identity"] as Record<string, string>) ?? {};
        const contact = (map["contact"] as Record<string, string>) ?? {};
        const whatsapp = (map["whatsapp"] as Record<string, string>) ?? {};

        setSettings({
          name: identity["name"] ?? DEFAULT_SETTINGS.name,
          tagline: identity["tagline"] ?? DEFAULT_SETTINGS.tagline,
          primaryColor: identity["primaryColor"] ?? "#2a1510",
          secondaryColor: identity["secondaryColor"] ?? "#c9a84c",
          email: contact["email"] ?? DEFAULT_SETTINGS.email,
          phone: contact["phone"] ?? DEFAULT_SETTINGS.phone,
          whatsapp: contact["whatsapp"] ?? DEFAULT_SETTINGS.whatsapp,
          address: contact["address"] ?? DEFAULT_SETTINGS.address,
          hours: contact["hours"] ?? DEFAULT_SETTINGS.hours,
          mapUrl: contact["mapUrl"] ?? "",
          whatsappNumber: whatsapp["number"] ?? DEFAULT_SETTINGS.whatsappNumber,
          whatsappMessage: whatsapp["defaultMessage"] ?? DEFAULT_SETTINGS.whatsappMessage,
        });
        setSocialLinks((map["social"] as SocialLink[]) ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveSection = async (key: "identity" | "contact" | "social" | "whatsapp", value: unknown) => {
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

  const addSocial = () => {
    if (!newSocial.url || !newSocial.label) return;
    setSocialLinks([...socialLinks, newSocial as SocialLink]);
    setNewSocial({ platform: "instagram", url: "", label: "" });
  };

  const removeSocial = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Configurações do Site
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie identidade, contato, redes sociais e WhatsApp da loja.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <BadgePercent className="h-5 w-5 text-gold-dark" /> Identidade
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
    </div>
  );
}