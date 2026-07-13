"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { NavIcon } from "@/components/nav-icon";
import { ADMIN_NAV } from "@/lib/config";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="workspace-shell admin-workspace">
      <aside className={`workspace-sidebar admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Logo href="/adminrandinu/dashboard" compact inverse />
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={21} /></button>
        </div>
        <div className="admin-private-badge"><ShieldCheck size={16} /> Private teacher workspace</div>
        <nav className="workspace-nav" aria-label="Teacher administration navigation">
          <span className="workspace-nav-label">ADMINISTRATION</span>
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/adminrandinu/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setOpen(false)}>
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-links">
          <Link href="/" target="_blank">View public website <ArrowUpRight size={15} /></Link>
          <Link href="/">Sign out <LogOut size={15} /></Link>
        </div>
      </aside>
      {open && <button className="workspace-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="workspace-main">
        <header className="workspace-topbar admin-topbar">
          <button className="workspace-menu" type="button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={23} /></button>
          <div className="workspace-topbar-title"><span>Randinu Jayaratne</span><strong>Smart ICT Administration</strong></div>
          <div className="admin-owner-chip"><span className="workspace-avatar">RJ</span><div><strong>Randinu</strong><small>Administrator</small></div></div>
        </header>
        <main className="workspace-content admin-content">{children}</main>
      </div>
    </div>
  );
}
