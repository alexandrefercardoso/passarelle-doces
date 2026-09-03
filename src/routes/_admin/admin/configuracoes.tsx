"use client";

import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Banknote,
  CreditCard,
  Eye,
  EyeOff,
  HandCoins,
  Heart,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Save,
  Share2,
  Truck,
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
import { Switch } from "@/components/ui/switch";
import { fetchSiteSettings, adminUpdateSiteSettings, uploadImage } from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { fileToResizedDataUrl } from "@/lib/image";
import type { PaymentOption, SiteSettings, SocialLink, ShippingMethod, ValueItem } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/configuracoes")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "identity" | "contact" | "social" | "images" | "shipping" | "payments"
  >("identity");

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
      } else if (activeTab === "images") {
        results.push(await adminUpdateSiteSettings("imageProvider", settings.imageProvider));
      } else if (activeTab === "shipping") {
        results.push(
          await adminUpdateSiteSettings("shipping", {
            methods: settings.shippingMethods,
            freeShippingThreshold: settings.freeShippingThreshold,
            freeShippingEnabled: settings.freeShippingEnabled,
          }),
        );
      } else if (activeTab === "payments") {
        results.push(
          await adminUpdateSiteSettings("payments", {
            methods: settings.paymentMethods,
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
        onValueChange={(v) =>
          setActiveTab(
            v as "identity" | "contact" | "social" | "images" | "shipping" | "payments",
          )
        }
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="identity">
            <User className="h-4 w-4" /> Identidade
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4" /> Contato
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4" /> Redes
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="h-4 w-4" /> Envio
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4" /> Pagamentos
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="h-4 w-4" /> Imagens
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

        <TabsContent value="shipping" className="mt-4 space-y-4">
          <ShippingCard settings={settings} update={update} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-4">
          <PaymentCard settings={settings} update={update} />
        </TabsContent>

        <TabsContent value="images" className="mt-4 space-y-4">
          <ImageProviderCard settings={settings} update={update} />
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
      const res = await uploadImage(file, { kind: "site", folder: "banners" });
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

function ImageProviderCard({
  settings,
  update,
}: {
  settings: SiteSettings;
  update: SettingsUpdater;
}) {
  const setProvider = (key: keyof SiteSettings["imageProvider"], value: string) => {
    update("imageProvider", { ...settings.imageProvider, [key]: value });
  };

  return (
    <SectionCard
      icon={<ImageIcon className="h-5 w-5 text-gold-dark" />}
      title="Armazenamento de imagens"
      description="Configure o Cloudinary para subir as fotos de produtos e banners sem ocupar o banco do Supabase."
    >
      <p className="rounded-2xl bg-cream/60 p-4 text-sm text-muted-foreground">
        Se os campos abaixo estiverem preenchidos, as fotos vão direto para o Cloudinary (escalável
        para mais de 1000 imagens). Se deixar vazio, elas usam o armazenamento do Supabase. Para
        obter os dados: no painel do Cloudinary, copie o <strong>Cloud name</strong> (Dashboard) e o{" "}
        <strong>Upload preset</strong> (Settings → Upload → Upload presets → crie um como{" "}
        <em>unsigned</em>).
      </p>

      <Field
        label="Cloud name"
        value={settings.imageProvider.cloudName}
        onChange={(v) => setProvider("cloudName", v)}
        placeholder="Ex: dsp1kqxyz"
      />
      <Field
        label="Upload preset (unsigned)"
        value={settings.imageProvider.uploadPreset}
        onChange={(v) => setProvider("uploadPreset", v)}
        placeholder="Ex: loja_doces"
      />
      <Field
        label="Pasta (opcional)"
        value={settings.imageProvider.folder}
        onChange={(v) => setProvider("folder", v)}
        placeholder="Ex: produtos"
      />
    </SectionCard>
  );
}

function ShippingCard({ settings, update }: { settings: SiteSettings; update: SettingsUpdater }) {
  const setMethod = (i: number, key: keyof ShippingMethod, v: string | number) => {
    const methods = settings.shippingMethods.map((m, idx) =>
      idx === i ? { ...m, [key]: v } : m,
    );
    update("shippingMethods", methods);
  };
  const addMethod = () => {
    update("shippingMethods", [
      ...settings.shippingMethods,
      {
        id: `metodo-${Date.now()}`,
        name: "",
        price: 0,
        estimate: "",
      },
    ]);
  };
  const removeMethod = (i: number) => {
    update(
      "shippingMethods",
      settings.shippingMethods.filter((_, idx) => idx !== i),
    );
  };

  return (
    <>
      <SectionCard
        icon={<Truck className="h-5 w-5 text-gold-dark" />}
        title="Formas de envio"
        description="As opções que o cliente verá ao finalizar a compra. Você define o nome, o valor e o prazo de cada uma."
      >
        <p className="rounded-2xl bg-cream/60 p-4 text-sm text-muted-foreground">
          Deixe <strong>flexível</strong>: você pode manter apenas "Retirada na loja", adicionar a
          entrega na casa do cliente com o valor que quiser, criar uma "encomenda" com prazo
          estendido, ou o que fizer sentido para o seu negócio. Tudo aparece automaticamente no
          checkout.
        </p>

        <div className="space-y-3">
          {settings.shippingMethods.map((m, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Opção {i + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMethod(i)}
                  aria-label="Remover opção"
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nome da forma de envio *"
                  value={m.name}
                  onChange={(v) => setMethod(i, "name", v)}
                  placeholder="Ex: Entrega na sua casa"
                />
                <Field
                  label="Valor (R$) *"
                  value={String(m.price)}
                  onChange={(v) => setMethod(i, "price", Number(v) || 0)}
                  placeholder="Ex: 12.5"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Prazo estimado"
                  value={m.estimate}
                  onChange={(v) => setMethod(i, "estimate", v)}
                  placeholder="Ex: 2 a 5 dias úteis"
                />
                <Field
                  label="Descrição (opcional)"
                  value={m.description ?? ""}
                  onChange={(v) => setMethod(i, "description", v)}
                  placeholder="Ex: Entregamos com todo o cuidado"
                />
              </div>
            </div>
          ))}
          {settings.shippingMethods.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma forma de envio cadastrada. Adicione pelo menos uma.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={addMethod}
        >
          + Adicionar forma de envio
        </Button>
      </SectionCard>

      <SectionCard
        icon={<Truck className="h-5 w-5 text-gold-dark" />}
        title="Frete grátis"
        description="Configure se você quer oferecer frete grátis a partir de um valor de compra."
      >
        <div className="flex items-center justify-between rounded-2xl border border-border p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Ativar frete grátis</p>
            <p className="text-xs text-muted-foreground">
              Quando ativado, o frete é grátis se o subtotal do carrinho atingir o valor mínimo.
            </p>
          </div>
          <Switch
            checked={settings.freeShippingEnabled}
            onCheckedChange={(v) => update("freeShippingEnabled", v)}
          />
        </div>

        {settings.freeShippingEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Valor mínimo para frete grátis (R$)"
              value={String(settings.freeShippingThreshold)}
              onChange={(v) => update("freeShippingThreshold", Number(v) || 0)}
              placeholder="Ex: 199"
            />
          </div>
        )}
      </SectionCard>
    </>
  );
}

function PaymentCard({ settings, update }: { settings: SiteSettings; update: SettingsUpdater }) {
  const methods = settings.paymentMethods ?? [];
  const setMethod = (i: number, key: keyof PaymentOption, v: string | number | boolean | undefined) => {
    const next = methods.map((m, idx) => (idx === i ? { ...m, [key]: v } : m));
    update("paymentMethods", next);
  };
  const addMethod = () => {
    update("paymentMethods", [
      ...methods,
      {
        id: `pagamento-${Date.now()}`,
        name: "",
        description: "",
        type: "aberto",
      },
    ]);
  };
  const removeMethod = (i: number) => {
    update("paymentMethods", methods.filter((_, idx) => idx !== i));
  };

  return (
    <>
      <SectionCard
        icon={<CreditCard className="h-5 w-5 text-gold-dark" />}
        title="Formas de pagamento"
        description="Escolha quais métodos aparecem no checkout e como cada um deve ser tratado."
      >
        <p className="rounded-2xl bg-cream/60 p-4 text-sm text-muted-foreground">
          <strong>Flexível:</strong> Pix, cartão de crédito/débito, boleto, dinheiro, cheque,
          caderneta — ative apenas o que você aceita. Para cada método escolha o{" "}
          <strong>tipo de recebimento</strong>:
          <ul className="mt-2 list-inside space-y-1">
            <li className="list-disc">
              <strong className="text-chocolate-dark">Imediato</strong> — o cliente paga na hora
              (ex: Pix, cartão).
            </li>
            <li className="list-disc">
              <strong className="text-chocolate-dark">Em aberto</strong> — o pedido fica pendente e
              aparece no Financeiro para você baixar quando receber (ex: boleto, cheque, caderneta,
              dinheiro na entrega).
            </li>
          </ul>
        </p>

        <div className="space-y-3">
          {methods.map((m, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Método {i + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMethod(i)}
                  aria-label="Remover método"
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nome do método *"
                  value={m.name}
                  onChange={(v) => setMethod(i, "name", v)}
                  placeholder="Ex: Pix, Cartão, Boleto..."
                />
                <Field
                  label="Descrição (opcional)"
                  value={m.description ?? ""}
                  onChange={(v) => setMethod(i, "description", v)}
                  placeholder="Ex: Aprovação imediata"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Tipo de recebimento *
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={m.type === "imediato" ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setMethod(i, "type", "imediato")}
                    >
                      <CreditCard className="h-4 w-4" /> Imediato
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={m.type === "aberto" ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setMethod(i, "type", "aberto")}
                    >
                      <HandCoins className="h-4 w-4" /> Em aberto
                    </Button>
                  </div>
                </div>
                <Field
                  label="Desconto % (opcional)"
                  value={m.discount ? String(m.discount) : ""}
                  onChange={(v) => setMethod(i, "discount", v === "" ? undefined : Number(v) || 0)}
                  placeholder="Ex: 5"
                />
              </div>
            </div>
          ))}
          {methods.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum método de pagamento cadastrado. Adicione pelo menos um.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={addMethod}
        >
          <Plus className="h-4 w-4" /> Adicionar método de pagamento
        </Button>
      </SectionCard>
    </>
  );
}
