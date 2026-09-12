import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/store-layout";

export const Route = createFileRoute("/_store")({
  head: () => ({
    links: [{ rel: "manifest", href: "/site.webmanifest" }],
  }),
  component: StoreLayout,
});
