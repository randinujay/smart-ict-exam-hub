"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { PUBLIC_NAV } from "@/lib/config";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="public-header">
      <div className="site-shell public-header-inner">
        <Logo />
        <nav className={`public-nav ${open ? "is-open" : ""}`} aria-label="Public navigation">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="button button-primary nav-login" onClick={() => setOpen(false)}>
            Student Login
          </Link>
        </nav>
        <button className="mobile-menu-button" type="button" aria-label="Toggle navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
