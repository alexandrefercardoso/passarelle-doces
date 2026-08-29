import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/store-layout";

export const Route = createFileRoute("/_store")({
  component: StoreLayout,
});
