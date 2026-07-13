"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { NavIcon } from "@/components/nav-icon";
import { STUDENT_NAV } from "@/lib/config";
import type { StudentProfile } from "@/lib/types";

export function LmsShell({ children, student }: { children: React.ReactNode; student: StudentProfile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Logo href="/app/dashboard" compact />
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={21} /></button>
        </div>
        <nav className="workspace-nav" aria-label="Student LMS navigation">
          <span className="workspace-nav-label">SMART ICT LMS</span>
          {STUDENT_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setOpen(false)}>
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-help-card">
          <strong>Need a hand?</strong>
          <p>Message Smart ICT support directly through WhatsApp.</p>
          <Link href="/app/support">Open support</Link>
        </div>
        <Link href="/" className="sidebar-signout"><LogOut size={17} /> Leave LMS</Link>
      </aside>
      {open && <button className="workspace-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="workspace-menu" type="button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={23} /></button>
          <div className="workspace-topbar-title">
            <span>Randinu Jayaratne</span>
            <strong>Smart ICT LMS</strong>
          </div>
          <div className="workspace-user-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <Link href="/app/profile" className="workspace-profile-chip">
              <span className="workspace-avatar">{initials}</span>
              <span className="workspace-profile-copy"><strong>{student.firstName}</strong><small>{student.accountStatus}</small></span>
              <ChevronDown size={16} />
            </Link>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
