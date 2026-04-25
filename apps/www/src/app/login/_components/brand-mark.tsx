import { WalletCards } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <WalletCards className="size-5" aria-hidden="true" />
      </span>
      <span
        className={
          compact
            ? "font-semibold text-2xl tracking-tight"
            : "font-semibold text-3xl tracking-tight"
        }
      >
        FluxCred
      </span>
    </div>
  );
}
