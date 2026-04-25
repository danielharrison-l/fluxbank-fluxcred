import {
  ChartNoAxesColumn,
  Home,
  ListChecks,
  User,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

const items = [
  { label: "Home", href: "#", icon: Home, active: true },
  { label: "Extrato", href: "#", icon: ListChecks },
  { label: "Analise", href: "#", icon: ChartNoAxesColumn },
  { label: "Credito", href: "#", icon: WalletCards },
  { label: "Perfil", href: "#", icon: User },
];

export function MobileLoginNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-lg md:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            to={item.href}
            key={item.label}
            className={
              item.active
                ? "flex flex-col items-center rounded-xl bg-teal-50 px-3 py-1 text-teal-700"
                : "flex flex-col items-center px-2 py-1 text-slate-400"
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
