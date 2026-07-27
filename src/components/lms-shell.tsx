"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { NavIcon } from "@/components/nav-icon";
import { WorkspaceThemeToggle } from "@/components/workspace-theme-toggle";
import { useWorkspaceFeedback } from "@/components/use-workspace-feedback";
import { STUDENT_NAV } from "@/lib/config";
import type { StudentProfile } from "@/lib/types";
import { signOutAction } from "@/app/actions/auth";

export function LmsShell({ children, student }: { children: React.ReactNode; student: StudentProfile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  const feedback = useWorkspaceFeedback(pathname, children);

  return (
    <div className={`workspace-shell ${feedback.busy ? "is-busy" : ""}`} onClickCapture={feedback.onClickCapture} onSubmitCapture={feedback.onSubmitCapture}>
      {feedback.busy && <div className="workspace-progress" role="status" aria-label={feedback.pendingHref ? "Opening page" : "Saving changes"}><span /></div>}
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
              <Link key={item.href} href={item.href} className={`${active ? "active" : ""} ${feedback.pendingHref === item.href ? "is-pending" : ""}`} onClick={() => setOpen(false)}>
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link href="/app/support" className="sidebar-support-link">Support</Link>
        <form action={signOutAction}><button className="sidebar-signout"><LogOut size={17} />Sign out</button></form>
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
            <WorkspaceThemeToggle />
            <Link href="/app/profile" className="workspace-profile-chip">
              <span className="workspace-avatar">{initials}</span>
              <span className="workspace-profile-copy"><strong>{student.firstName}</strong><small>{student.accountStatus}</small></span>
            </Link>
          </div>
        </header>
        <main className="workspace-content" aria-busy={feedback.busy}>{children}</main>
      </div>
    </div>
  );
}
