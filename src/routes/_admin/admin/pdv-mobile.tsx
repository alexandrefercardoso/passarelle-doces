"use client";

import { createFileRoute } from "@tanstack/react-router";
import { PdvMobilePage } from "@/components/admin/pdv-mobile";

export const Route = createFileRoute("/_admin/admin/pdv-mobile")({
  component: PdvMobilePage,
});
