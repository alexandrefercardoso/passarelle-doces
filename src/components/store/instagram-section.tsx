import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import type { InstagramPost } from "@/lib/types";
import { ProductImage } from "./product-image";
import { SectionSkeleton } from "./skeleton";

type InstagramSectionProps = {
  posts: InstagramPost[] | undefined;
  isLoading: boolean;
};

export function InstagramSection({ posts, isLoading }: InstagramSectionProps) {
  return (
    <section aria-label="Instagram da Passarelli Doces">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Siga a Passarelli Doces
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Acompanhe nossas novidades, bastidores e algumas fofuras diárias no Instagram.
        </p>
        <Link
          to="/contato"
          className="mt-1 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold hover:text-gold-dark"
        >
          <Instagram className="h-4 w-4 text-gold-dark" />
          @passarellidoces
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-6">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.linkUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-2xl bg-cream"
              >
                <ProductImage
                  src={post.imageUrl}
                  alt="Foto do Instagram da Passarelli Doces"
                  emoji="🍬"
                  className="transition-transform duration-500 group-hover:scale-110"
                  sizes="16vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-chocolate/0 opacity-0 transition-all duration-300 group-hover:bg-chocolate/40 group-hover:opacity-100">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
