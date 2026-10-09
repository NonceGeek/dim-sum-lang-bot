"use client";

import { PawPrint } from "lucide-react";
import Link from "next/link";

export function DimSumPetCard() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <PawPrint className="h-5 w-5" />
          DimSum Pet：可互动的多语言电子宠物
        </h3>
        <Link
          href="/mochi"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          DimSum Pet
        </Link>
      </div>
    </div>
  );
}
