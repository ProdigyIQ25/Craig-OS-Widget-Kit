"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_PRIMARY_NAV } from "@/lib/phase15/nav";
import { COMMAND_SURFACE_ROUTES } from "@/lib/phase15/routes";

function isActive(pathname: string, href: string): boolean {
  if (href === COMMAND_SURFACE_ROUTES.home) return pathname === "/";
  if (href === COMMAND_SURFACE_ROUTES.personal) {
    return (
      pathname === COMMAND_SURFACE_ROUTES.personal ||
      (pathname.startsWith("/personal/") &&
        pathname !== COMMAND_SURFACE_ROUTES.personalToday &&
        pathname !== COMMAND_SURFACE_ROUTES.personalFocus)
    );
  }
  if (href === COMMAND_SURFACE_ROUTES.business) {
    return pathname === COMMAND_SURFACE_ROUTES.business || pathname.startsWith("/business/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="p15-mobile-nav" aria-label="Primary mobile navigation" data-pwa-chrome="bottom-nav">
      {MOBILE_PRIMARY_NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className="p15-mobile-nav-item"
            aria-current={active ? "page" : undefined}
            data-nav={item.id}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
