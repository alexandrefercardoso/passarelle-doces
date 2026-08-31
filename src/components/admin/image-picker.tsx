"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/api";
import { fileToResizedDataUrl } from "@/lib/image";

export function ImagePicker({
  label,
  value,
  onChange,
  folder = "geral",
  kind = "site",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  kind?: "site" | "product";
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file, { kind, folder });
      if (res.ok && res.url) {
        onChange(res.url);
        toast.success("Imagem enviada!", {
          description: res.url.startsWith("data:")
            ? "Salva localmente (base64)."
            : "Enviada para o provedor de imagens.",
        });
      } else {
        const fallback = await fileToResizedDataUrl(file);
        onChange(fallback);
        toast.info("Imagem salva localmente (base64)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar imagem";
      toast.error("Ops!", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-start gap-3">
        <div className="relative flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
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
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-red-500"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" /> Remover
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleImage}
          />
        </div>
      </div>
    </div>
  );
}
