"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CONTEXT_SWITCH, type NavItem } from "@/lib/phase15/nav";
import { ConnectivityBanner } from "./connectivity-banner";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { PwaRegister } from "./pwa-register";

export function AppShell({
  context,
  children,
}: {
  context: "home" | "personal" | "business" | "spiritual";
  children: ReactNode;
}) {
  return (
    <main className="p15-shell" data-context={context} data-pwa-shell="true">
      <ConnectivityBanner />
      <div className="p15-shell-body">{children}</div>
      <MobileBottomNav />
      <PwaRegister />
    </main>
  );
}

export function CommandHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="p15-header">
      <div>
        <p className="p15-brand">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="p15-lede">{subtitle}</p>
      </div>
      {actions ? <div className="p15-header-actions">{actions}</div> : null}
    </header>
  );
}

export function ContextSwitcher({ current }: { current: "home" | "personal" | "business" }) {
  return (
    <nav className="p15-context" aria-label="Operating system">
      {CONTEXT_SWITCH.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.id === current ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function NavigationRail({
  items,
  currentHref,
  label = "Operating modes",
}: {
  items: NavItem[];
  currentHref: string;
  label?: string;
}) {
  return (
    <nav className="p15-rail" aria-label={label} data-rail="secondary">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.href === currentHref ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
