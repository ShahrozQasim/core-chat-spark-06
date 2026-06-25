import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  LogOut,
  MessageSquarePlus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { authService, chatService } from "@/services/api";
import type { Chat } from "@/lib/types";

const nav = [
  { to: "/chat" as const, label: "Chats", icon: MessageSquarePlus },
  { to: "/personalities" as const, label: "Personalities", icon: Sparkles },
  { to: "/reports" as const, label: "Reports", icon: BarChart3 },
  { to: "/settings" as const, label: "Settings", icon: Settings },
];

export function AppSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <SidebarBody onNavigate={() => undefined} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
            onClick={onMobileClose}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <Wordmark />
                <Button variant="ghost" size="icon" onClick={onMobileClose} aria-label="Close">
                  <X className="size-5" />
                </Button>
              </div>
              <SidebarBody onNavigate={onMobileClose} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarBody({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setChats(chatService.list());
  }, [tick, pathname]);

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.toLowerCase();
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [chats, query]);

  function onNewChat() {
    const chat = chatService.create();
    onNavigate();
    setTick((t) => t + 1);
    navigate({ to: "/chat", search: { c: chat.id } });
  }

  function onDelete(id: string) {
    chatService.remove(id);
    setTick((t) => t + 1);
  }

  function onLogout() {
    authService.signOut();
    onNavigate();
    navigate({ to: "/login" });
  }

  const user = authService.current();

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="hidden px-4 pt-5 md:block">
        <Wordmark />
      </div>

      <div className="px-3 pt-4">
        <Button onClick={onNewChat} className="h-10 w-full justify-start gap-2 rounded-xl">
          <MessageSquarePlus className="size-4" /> New chat
        </Button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="h-9 rounded-lg bg-sidebar-accent pl-8 text-sm"
          />
        </div>
      </div>

      <nav className="mt-4 space-y-1 px-2">
        {nav.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 flex items-center justify-between px-4 pb-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          History
        </h3>
        <span className="text-[11px] text-muted-foreground">{filtered.length}</span>
      </div>
      <div className="cc-scroll flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No chats yet. Start a new one above.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c) => {
              const isActive = pathname === "/chat";
              return (
                <li key={c.id} className="group relative">
                  <Link
                    to="/chat"
                    search={{ c: c.id }}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 pr-8 text-sm transition-colors",
                      isActive
                        ? "hover:bg-sidebar-accent/60"
                        : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    <span className="line-clamp-1 flex-1 text-sidebar-foreground/90">
                      {c.title || "Untitled chat"}
                    </span>
                  </Link>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-background hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? "Guest"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            aria-label="Sign out"
            className="size-8"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
