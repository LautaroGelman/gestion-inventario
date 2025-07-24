"use client";

/*
  Mega‑sized Sidebar 🟣
  ‑ Desktop: 18 rem (288 px) expanded ➜ 5 rem (80 px) collapsed
  ‑ Mobile (< md): Sheet full‑height slide‑in
  ‑ Items: h‑14  |  gap‑4  |  text‑lg  |  icon 24 px (lucide size‑6)
  ‑ Exposed API: SidebarProvider, Sidebar, SidebarItem, useSidebar
*/

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                  Context                                   */
/* -------------------------------------------------------------------------- */

type SidebarCtx = {
    open: boolean;
    toggle: () => void;
};
const SidebarContext = React.createContext<SidebarCtx | null>(null);
export const useSidebar = () => {
    const ctx = React.useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
    return ctx;
};

/* -------------------------------------------------------------------------- */
/*                               Configuration                                */
/* -------------------------------------------------------------------------- */

const EXPANDED_W = "18rem"; // 288 px
const COLLAPSED_W = "5rem"; //  80 px

/* -------------------------------------------------------------------------- */
/*                               Provider Shell                               */
/* -------------------------------------------------------------------------- */

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState<boolean>(true);
    const toggle = () => setOpen((p) => !p);

    return (
        <SidebarContext.Provider value={{ open, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/*                                   Sidebar                                  */
/* -------------------------------------------------------------------------- */

export function Sidebar({ children }: { children: React.ReactNode }) {
    const { open, toggle } = useSidebar();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // Mobile ➜ Sheet
    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={toggle}>
                <SheetContent
                    side="left"
                    className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground"
                >
                    <nav className="flex flex-col gap-2 p-4">{children}</nav>
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop ➜ fixed sidebar with collapse
    return (
        <aside
            data-collapsed={!open}
            className={cn(
                "z-30 hidden shrink-0 bg-sidebar text-sidebar-foreground md:block transition-[width] duration-200",
                open ? `w-[${EXPANDED_W}]` : `w-[${COLLAPSED_W}]`
            )}
        >
            {/* trigger */}
            <button
                onClick={toggle}
                className="m-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground hover:opacity-90"
            >
                <PanelLeft className="size-6" />
                <span className="sr-only">Toggle sidebar</span>
            </button>

            {/* content */}
            <nav
                className={cn(
                    "flex flex-col gap-2 px-2 pb-6",
                    open ? "mt-4" : "mt-2 items-center"
                )}
            >
                {children}
            </nav>
        </aside>
    );
}

/* -------------------------------------------------------------------------- */
/*                                   Item                                     */
/* -------------------------------------------------------------------------- */

export interface SidebarItemProps {
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    active?: boolean;
    asChild?: boolean;
}

export function SidebarItem({
                                href,
                                icon: Icon,
                                label,
                                active,
                                asChild,
                            }: SidebarItemProps) {
    const { open } = useSidebar();
    const Comp: any = asChild ? Slot : Link;

    return (
        <Comp
            href={href}
            data-active={active}
            className={cn(
                "group flex w-full items-center gap-4 rounded-lg px-4 py-3 h-14 text-lg font-medium outline-none transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                !open && "justify-center px-0"
            )}
        >
            <Icon className="size-6 shrink-0" />
            {open && <span className="truncate">{label}</span>}
        </Comp>
    );
}
