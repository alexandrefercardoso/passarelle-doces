"use client";

import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Palette,
  Phone,
  Save,
  Share2,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSiteSettings, adminUpdateSiteSettings, uploadSiteImage } from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { SiteSettings, SocialLink, ValueItem } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/configuracoes")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "contact" | "social">("identity");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetchSiteSettings();
        if (mounted) setSettings(res);
      } catch {
        if (mounted) setSettings(DEFAULT_SETTINGS);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const saveTab = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const results: { ok: boolean; error?: string }[] = [];
      if (activeTab === "identity") {
        results.push(
          await adminUpdateSiteSettings("identity", {
            name: settings.name,
            tagline: settings.tagline,
            primaryColor: settings.primaryColor,
            secondaryColor: settings.secondaryColor,
            history: settings.history,
            mission: settings.mission,
            vision: settings.vision,
            values: settings.values,
            productsPageBanner: settings.productsPageBanner,
            productsPageBannerAlt: settings.productsPageBannerAlt,
          }),
        );
      } else if (activeTab === "contact") {
        results.push(
          await adminUpdateSiteSettings("contact", {
            email: settings.email,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            address: settings.address,
            hours: settings.hours,
            mapUrl: settings.mapUrl,
            cnpj: settings.cnpj,
          }),
        );
        results.push(
          await adminUpdateSiteSettings("whatsapp", {
            number: settings.whatsappNumber,
            defaultMessage: settings.whatsappMessage,
          }),
        );
      } else {
        results.push(await adminUpdateSiteSettings("social", settings.social));
      }

      const failed = results.find((r) => !r.ok);
      if (failed) {
        toast.error("Não foi possível salvar", {
          description: failed.error ?? "Tente novamente.",
        });
        return;
      }
      toast.success("Configurações salvas!", {
        description: "As alterações foram registradas.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Ops!", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const persistIdentity = async (next: SiteSettings) => {
    const res = await adminUpdateSiteSettings("identity", {
      name: next.name,
      tagline: next.tagline,
      primaryColor: next.primaryColor,
      secondaryColor: next.secondaryColor,
      history: next.history,
      mission: next.mission,
      vision: next.vision,
      values: next.values,
      productsPageBanner: next.productsPageBanner,
      productsPageBannerAlt: next.productsPageBannerAlt,
    });
    if (!res.ok) {
      toast.error("Não foi possível salvar o banner", {
        description: res.error ?? "Tente novamente.",
      });
      return;
    }
    toast.success("Banner salvo!", {
      description: "A imagem foi gravada e já aparece na página de produtos.",
    });
  };

  const handleBannerChange = (url: string) => {
    if (!settings) return;
    const next = { ...settings, productsPageBanner: url };
    setSettings(next);
    void persistIdentity(next);
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!settings) {
    return (
      <p className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Configurações
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie a identidade, os dados de contato e as redes sociais da loja.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => void saveTab()} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar alterações
            </>
          )}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "identity" | "contact" | "social")}
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="identity">
            <User className="h-4 w-4" /> Identidade
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4" /> Contato
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4" /> Redes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4 space-y-4">
          <IdentityCard settings={settings} update={update} onBannerChange={handleBannerChange} />
        </TabsContent>

        <TabsContent value="contact" className="mt-4 space-y-4">
          <ContactCard settings={settings} update={update} />
          <WhatsAppCard settings={settings} update={update} />
        </TabsContent>

        <TabsContent value="social" className="mt-4 space-y-4">
          <SocialCard settings={settings} update={update} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type SettingsUpdater = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle className="font-display text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 4}
          className="min-h-24"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function IdentityCard({
  settings,
  update,
  onBannerChange,
}: {
  settings: SiteSettings;
  update: SettingsUpdater;
  onBannerChange: (url: string) => void;
}) {
  const setValue = (i: number, key: "title" | "description", v: string) => {
    const values = settings.values.map((item, idx) => (idx === i ? { ...item, [key]: v } : item));
    update("values", values as ValueItem[]);
  };
  const addValue = () => {
    update("values", [...settings.values, { title: "", description: "" }]);
  };
  const removeValue = (i: number) => {
    update(
      "values",
      settings.values.filter((_, idx) => idx !== i),
    );
  };

  return (
    <>
      <SectionCard
        icon={<Palette className="h-5 w-5 text-gold-dark" />}
        title="Identidade da marca"
        description="Nome, slogan e cores usadas em toda a loja."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da loja" value={settings.name} onChange={(v) => update("name", v)} />
          <Field
            label="Slogan / tagline"
            value={settings.tagline}
            onChange={(v) => update("tagline", v)}
          />
          <Field
            label="Cor primária"
            value={settings.primaryColor}
            onChange={(v) => update("primaryColor", v)}
          />
          <Field
            label="Cor secundária"
            value={settings.secondaryColor}
            onChange={(v) => update("secondaryColor", v)}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<Heart className="h-5 w-5 text-gold-dark" />}
        title="História e valores"
        description="Utilizados na página Quem Somos."
      >
        <Field
          label="História"
          value={settings.history}
          onChange={(v) => update("history", v)}
          textarea
          rows={5}
        />
        <Field
          label="Missão"
          value={settings.mission}
          onChange={(v) => update("mission", v)}
          textarea
          rows={3}
        />
        <Field
          label="Visão"
          value={settings.vision}
          onChange={(v) => update("vision", v)}
          textarea
          rows={3}
        />

        <div className="pt-1">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Valores</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={addValue}
            >
              + Adicionar valor
            </Button>
          </div>
          <div className="space-y-3">
            {settings.values.map((value, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={value.title}
                    onChange={(e) => setValue(i, "title", e.target.value)}
                    placeholder="Título"
                  />
                  <Input
                    value={value.description}
                    onChange={(e) => setValue(i, "description", e.target.value)}
                    placeholder="Descrição"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeValue(i)}
                  aria-label="Remover valor"
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<ImagePlus className="h-5 w-5 text-gold-dark" />}
        title="Banner da página de produtos"
        description="Imagem exibida acima da busca de produtos. Envie a foto para o servidor."
      >
        <ImageUploadField
          label="Foto do banner"
          value={settings.productsPageBanner}
          alt={settings.productsPageBannerAlt}
          onChangeUrl={onBannerChange}
          onChangeAlt={(alt) => update("productsPageBannerAlt", alt)}
        />
        <Field
          label="Texto alternativo (alt)"
          value={settings.productsPageBannerAlt}
          onChange={(v) => update("productsPageBannerAlt", v)}
        />
      </SectionCard>
    </>
  );
}

function ImageUploadField({
  label,
  value,
  alt,
  onChangeUrl,
  onChangeAlt,
}: {
  label: string;
  value: string;
  alt: string;
  onChangeUrl: (url: string) => void;
  onChangeAlt: (alt: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const shownValue = localPreview || value;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      let url = "";
      const res = await uploadSiteImage(file, "banners").catch(() => null);
      if (res?.ok && res.url) {
        url = res.url;
      } else {
        const fallback = await fileToResizedDataUrl(file);
        url = fallback;
      }
      if (!url) {
        toast.error("Não foi possível enviar a imagem", {
          description: "O armazenamento não está disponível no momento. Tente novamente.",
        });
        return;
      }
      setLocalPreview(url);
      onChangeUrl(url);
      onChangeAlt(file.name.replace(/\.[^.]+$/, "") || alt);
      toast.success(url.startsWith("data:") ? "Imagem salva localmente!" : "Imagem enviada!", {
        description: "A foto foi carregada.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      toast.error("Ops!", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setLocalPreview("");
    onChangeUrl("");
    toast.success("Imagem removida", {
      description: "O banner foi removido. Clique em Salvar alterações para confirmar.",
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-start gap-3">
        <div className="relative flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
          {shownValue ? (
            <img src={shownValue} alt={alt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
              <span className="px-2 text-center text-xs">Sem imagem</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : "Enviar foto"}
          </Button>
          {shownValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-red-500"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ContactCard({ settings, update }: { settings: SiteSettings; update: SettingsUpdater }) {
  return (
    <SectionCard
      icon={<Phone className="h-5 w-5 text-gold-dark" />}
      title="Dados de contato"
      description="Exibidos no rodapé e na página de contato."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail" value={settings.email} onChange={(v) => update("email", v)} />
        <Field label="Telefone" value={settings.phone} onChange={(v) => update("phone", v)} />
        <Field
          label="WhatsApp (somente números, ex: 5511987654321)"
          value={settings.whatsapp}
          onChange={(v) => update("whatsapp", v)}
        />
        <Field label="CNPJ" value={settings.cnpj} onChange={(v) => update("cnpj", v)} />
        <Field label="Endereço" value={settings.address} onChange={(v) => update("address", v)} />
        <Field label="Horários" value={settings.hours} onChange={(v) => update("hours", v)} />
      </div>
      <Field
        label="URL do mapa (embed do Google Maps)"
        value={settings.mapUrl}
        onChange={(v) => update("mapUrl", v)}
      />
    </SectionCard>
  );
}

function WhatsAppCard({ settings, update }: { settings: SiteSettings; update: SettingsUpdater }) {
  const [showNumber, setShowNumber] = useState(true);
  return (
    <SectionCard
      icon={<MessageCircle className="h-5 w-5 text-gold-dark" />}
      title="Botão flutuante do WhatsApp"
      description="Configuração do botão que acompanha o usuário na loja."
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Número (somente números)
        </Label>
        <div className="relative">
          <Input
            value={settings.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
            placeholder="5511987654321"
            type={showNumber ? "text" : "password"}
          />
          <button
            type="button"
            onClick={() => setShowNumber(!showNumber)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Field
        label="Mensagem padrão"
        value={settings.whatsappMessage}
        onChange={(v) => update("whatsappMessage", v)}
        textarea
        rows={2}
      />
    </SectionCard>
  );
}

const PLATFORMS = ["instagram", "facebook", "whatsapp", "tiktok", "youtube", "outro"];

function SocialCard({ settings, update }: { settings: SiteSettings; update: SettingsUpdater }) {
  const setLink = (i: number, key: "platform" | "url" | "label", v: string) => {
    const social = settings.social.map((link, idx) => (idx === i ? { ...link, [key]: v } : link));
    update("social", social as SocialLink[]);
  };
  const addLink = () => {
    update("social", [...settings.social, { platform: "instagram", url: "", label: "" }]);
  };
  const removeLink = (i: number) => {
    update(
      "social",
      settings.social.filter((_, idx) => idx !== i),
    );
  };

  return (
    <SectionCard
      icon={<Share2 className="h-5 w-5 text-gold-dark" />}
      title="Redes sociais"
      description="Links exibidos no rodapé da loja."
    >
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={addLink}
        >
          + Adicionar rede
        </Button>
      </div>
      <div className="space-y-3">
        {settings.social.map((link, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[140px_1fr_1fr_auto]"
          >
            <select
              value={link.platform}
              onChange={(e) => setLink(i, "platform", e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <Input
              value={link.url}
              onChange={(e) => setLink(i, "url", e.target.value)}
              placeholder="URL"
            />
            <Input
              value={link.label}
              onChange={(e) => setLink(i, "label", e.target.value)}
              placeholder="Rótulo"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLink(i)}
              aria-label="Remover rede"
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {settings.social.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma rede social cadastrada. Clique em "Adicionar rede" para começar.
          </p>
        )}
      </div>
    </SectionCard>
  );
}

async function fileToResizedDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar a imagem"));
    image.src = dataUrl;
  });

  const MAX_WIDTH = 1400;
  const scale = img.naturalWidth > MAX_WIDTH ? MAX_WIDTH / img.naturalWidth : 1;
  const width = Math.round((img.naturalWidth || 1) * scale);
  const height = Math.round((img.naturalHeight || 1) * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
}
