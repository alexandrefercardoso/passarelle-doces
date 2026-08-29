"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

type HeroBannerProps = {
  banners: Banner[];
};

export function HeroBanner({ banners }: HeroBannerProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
      setCurrent(index);
    },
    [api],
  );

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || banners.length <= 1) return;
    const timer = setInterval(scrollNext, 6000);
    return () => clearInterval(timer);
  }, [api, banners.length, scrollNext]);

  return (
    <section className="relative" aria-label="Destaques da loja">
      <Carousel
        setApi={setApi}
        opts={{ loop: banners.length > 1, align: "start" }}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="group relative overflow-hidden rounded-3xl bg-cream">
                <div className="absolute inset-0">
                  <ProductImage
                    src={banner.imageUrl}
                    alt={banner.title}
                    emoji="🍰"
                    className="object-cover"
                    sizes="(min-width: 768px) 100vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2a1510]/70 via-[#2a1510]/35 to-transparent" />
                </div>

                <div className="relative z-10 flex min-h-[260px] max-w-7xl items-center px-4 py-10 sm:min-h-[360px] sm:px-6 md:px-10 lg:min-h-[420px] lg:px-14">
                  <div className="max-w-lg text-balance">
                    <span className="inline-block rounded-full border border-gold/60 bg-cream/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cream backdrop-blur-sm">
                      Passarelli Doces
                    </span>
                    <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/90 sm:text-base">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="mt-6">
                      <Link
                        to={banner.linkUrl as never}
                        className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-chocolate-dark shadow-lg shadow-gold/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold/40"
                      >
                        {banner.buttonText || "Ver Produtos"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {banners.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ir para slide ${index + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                current === index ? "w-8 bg-gold" : "w-2 bg-border hover:bg-gold/50",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
